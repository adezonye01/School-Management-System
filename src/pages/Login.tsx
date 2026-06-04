import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { School, Eye, EyeOff, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { useDataStore } from '../stores/dataStore';
import { useToast } from '../components/ui/Toast';
import { changeLanguage } from '../i18n';
import { loginRateLimiter, sanitizeInput } from '../utils/security';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { setCurrentBranch, setCurrentAcademicYear, language, setLanguage } = useAppStore();
  const { users, roles, branches, getAcademicYearsByBranch } = useDataStore();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLanguageToggle = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    changeLanguage(newLang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username);

    // Rate limiting
    if (!loginRateLimiter.isAllowed(sanitizedUsername)) {
      setError('Too many login attempts. Please try again later.');
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Find user (in real app, this would be an API call)
    const user = users.find(
      (u) => u.username === sanitizedUsername && u.passwordHash === password && u.isActive
    );

    if (!user) {
      setIsLoading(false);
      setError(t('auth.invalidCredentials'));
      return;
    }

    // Get user's role
    const role = roles.find((r) => r.id === user.roleId);
    if (!role) {
      setIsLoading(false);
      setError(t('auth.invalidCredentials'));
      return;
    }

    // Generate token (in real app, this would come from the server)
    const token = `token-${Math.random().toString(36).substr(2)}`;

    // Login
    login(user, role, token);

    // Set default branch and academic year
    const defaultBranch = branches.find((b) => b.id === user.currentBranchId);
    if (defaultBranch) {
      setCurrentBranch(defaultBranch);
      const years = getAcademicYearsByBranch(defaultBranch.id);
      const currentYear = years.find((y) => y.isCurrent);
      if (currentYear) {
        setCurrentAcademicYear(currentYear);
      }
    }

    showToast('success', t('common.success'));
    loginRateLimiter.reset(sanitizedUsername);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      {/* Language Toggle */}
      <button
        onClick={handleLanguageToggle}
        className="absolute top-4 end-4 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors"
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium">{language === 'ar' ? 'English' : 'العربية'}</span>
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-xl mb-4">
            <School className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('common.appName')}</h1>
          <p className="text-blue-100">{t('auth.loginSubtitle')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t('auth.loginTitle')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={t('auth.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoComplete="username"
            />

            <div className="relative">
              <Input
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              {t('auth.login')}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">
              {language === 'ar' ? 'بيانات الدخول التجريبية:' : 'Demo Credentials:'}
            </p>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>{t('auth.username')}:</strong> admin</p>
              <p><strong>{t('auth.password')}:</strong> admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
