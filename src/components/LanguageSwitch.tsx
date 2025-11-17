/**
 * 语言切换组件
 * Language Switch Component
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Languages } from 'lucide-react';

interface LanguageSwitchProps {
  variant?: 'default' | 'minimal';
  className?: string;
}

export default function LanguageSwitch({ variant = 'default', className = '' }: LanguageSwitchProps) {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  if (variant === 'minimal') {
    // 简洁版本：只显示语言代码
    return (
      <button
        onClick={toggleLanguage}
        className={`flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors ${className}`}
        aria-label="Switch Language"
      >
        <Languages className="h-4 w-4" />
        <span>{language === 'zh' ? '中文' : 'EN'}</span>
      </button>
    );
  }

  // 默认版本：带背景的按钮
  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors ${className}`}
      aria-label="Switch Language"
    >
      <Languages className="h-5 w-5 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">
        {language === 'zh' ? '中文' : 'English'}
      </span>
      <span className="text-xs text-gray-500">
        {language === 'zh' ? '→ EN' : '→ 中文'}
      </span>
    </button>
  );
}

