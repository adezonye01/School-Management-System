import { useAppStore } from '../stores/appStore';
import type { LocalizedText } from '../types/database';

/**
 * Hook to get the localized value based on current language
 */
export const useLocalizedValue = () => {
  const { language } = useAppStore();

  const getLocalizedValue = (text: LocalizedText | undefined | null): string => {
    if (!text) return '';
    return text[language] || text.ar || text.en || '';
  };

  return { getLocalizedValue, language };
};

/**
 * Get localized value directly (non-hook version for use outside components)
 */
export const getLocalizedText = (text: LocalizedText, language: 'ar' | 'en'): string => {
  return text[language] || text.ar || text.en || '';
};
