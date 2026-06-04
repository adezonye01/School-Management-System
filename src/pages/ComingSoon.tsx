import React from 'react';
import { Construction } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../stores/appStore';

export const ComingSoon: React.FC = () => {
  const { language } = useAppStore();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
          <Construction className="w-10 h-10 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {language === 'ar' ? 'قريباً' : 'Coming Soon'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'ar'
            ? 'هذه الميزة قيد التطوير وستكون متاحة قريباً.'
            : 'This feature is under development and will be available soon.'}
        </p>
      </Card>
    </div>
  );
};
