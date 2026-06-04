import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  Bell,
  User,
  LogOut,
  Settings,
  Globe,
  Building2,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useDataStore } from '../../stores/dataStore';
import { changeLanguage } from '../../i18n';
import { useLocalizedValue } from '../../hooks/useLocalizedValue';
import clsx from 'clsx';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { toggleSidebar, sidebarOpen, language, setLanguage, currentBranch, currentAcademicYear, setCurrentBranch, setCurrentAcademicYear } = useAppStore();
  const { user, logout } = useAuthStore();
  const { branches, getAcademicYearsByBranch } = useDataStore();
  const { getLocalizedValue } = useLocalizedValue();

  const handleLanguageChange = (lang: 'ar' | 'en') => {
    setLanguage(lang);
    changeLanguage(lang);
  };

  const userBranches = branches.filter((b) => user?.branchIds.includes(b.id) && b.isActive);
  const academicYears = currentBranch ? getAcademicYearsByBranch(currentBranch.id).filter(y => !y.isArchived) : [];

  const handleBranchChange = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
      // Reset academic year when branch changes
      const branchYears = getAcademicYearsByBranch(branchId);
      const currentYear = branchYears.find((y) => y.isCurrent);
      if (currentYear) {
        setCurrentAcademicYear(currentYear);
      }
    }
  };

  const handleYearChange = (yearId: string) => {
    const year = academicYears.find((y) => y.id === yearId);
    if (year) {
      setCurrentAcademicYear(year);
    }
  };

  return (
    <header
      className={clsx(
        'fixed top-0 end-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30 transition-all duration-300',
        sidebarOpen ? 'start-64' : 'start-20'
      )}
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Branch Selector */}
          <HeadlessMenu as="div" className="relative">
            <HeadlessMenu.Button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">
                {currentBranch ? getLocalizedValue(currentBranch.name) : t('branches.selectBranch')}
              </span>
              <ChevronDown className="w-4 h-4" />
            </HeadlessMenu.Button>
            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-in"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <HeadlessMenu.Items className="absolute start-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                {userBranches.map((branch) => (
                  <HeadlessMenu.Item key={branch.id}>
                    {({ active }) => (
                      <button
                        onClick={() => handleBranchChange(branch.id)}
                        className={clsx(
                          'w-full px-4 py-2 text-sm text-start',
                          active ? 'bg-gray-100 dark:bg-gray-700' : '',
                          currentBranch?.id === branch.id
                            ? 'text-blue-600 font-medium'
                            : 'text-gray-700 dark:text-gray-200'
                        )}
                      >
                        {getLocalizedValue(branch.name)}
                      </button>
                    )}
                  </HeadlessMenu.Item>
                ))}
              </HeadlessMenu.Items>
            </Transition>
          </HeadlessMenu>

          {/* Academic Year Selector */}
          <HeadlessMenu as="div" className="relative">
            <HeadlessMenu.Button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">
                {currentAcademicYear ? getLocalizedValue(currentAcademicYear.name) : t('academicYears.selectYear')}
              </span>
              <ChevronDown className="w-4 h-4" />
            </HeadlessMenu.Button>
            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-in"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <HeadlessMenu.Items className="absolute start-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                {academicYears.map((year) => (
                  <HeadlessMenu.Item key={year.id}>
                    {({ active }) => (
                      <button
                        onClick={() => handleYearChange(year.id)}
                        className={clsx(
                          'w-full px-4 py-2 text-sm text-start flex items-center justify-between',
                          active ? 'bg-gray-100 dark:bg-gray-700' : '',
                          currentAcademicYear?.id === year.id
                            ? 'text-blue-600 font-medium'
                            : 'text-gray-700 dark:text-gray-200'
                        )}
                      >
                        <span>{getLocalizedValue(year.name)}</span>
                        {year.isCurrent && (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                            {t('academicYears.isCurrent')}
                          </span>
                        )}
                      </button>
                    )}
                  </HeadlessMenu.Item>
                ))}
              </HeadlessMenu.Items>
            </Transition>
          </HeadlessMenu>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => handleLanguageChange(language === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <Globe className="w-5 h-5" />
            <span className="text-sm font-medium">
              {language === 'ar' ? 'EN' : 'عربي'}
            </span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 end-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <HeadlessMenu as="div" className="relative">
            <HeadlessMenu.Button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-start hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user ? getLocalizedValue(user.firstName) : ''}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </HeadlessMenu.Button>
            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-in"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <HeadlessMenu.Items className="absolute end-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button
                      className={clsx(
                        'w-full px-4 py-2 text-sm text-start flex items-center gap-2',
                        active ? 'bg-gray-100 dark:bg-gray-700' : '',
                        'text-gray-700 dark:text-gray-200'
                      )}
                    >
                      <User className="w-4 h-4" />
                      {t('common.profile')}
                    </button>
                  )}
                </HeadlessMenu.Item>
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button
                      className={clsx(
                        'w-full px-4 py-2 text-sm text-start flex items-center gap-2',
                        active ? 'bg-gray-100 dark:bg-gray-700' : '',
                        'text-gray-700 dark:text-gray-200'
                      )}
                    >
                      <Settings className="w-4 h-4" />
                      {t('common.settings')}
                    </button>
                  )}
                </HeadlessMenu.Item>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <HeadlessMenu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={clsx(
                        'w-full px-4 py-2 text-sm text-start flex items-center gap-2',
                        active ? 'bg-gray-100 dark:bg-gray-700' : '',
                        'text-red-600'
                      )}
                    >
                      <LogOut className="w-4 h-4" />
                      {t('common.logout')}
                    </button>
                  )}
                </HeadlessMenu.Item>
              </HeadlessMenu.Items>
            </Transition>
          </HeadlessMenu>
        </div>
      </div>
    </header>
  );
};
