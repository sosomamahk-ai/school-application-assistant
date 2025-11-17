/**
 * 语言切换组件
 * Language Switch Component
 * Supports: en, zh-CN, zh-TW
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Languages } from 'lucide-react';
import type { Language } from '@/config/translations';

interface LanguageSwitchProps {
  variant?: 'default' | 'minimal' | 'dropdown';
  className?: string;
}

const LANGUAGE_OPTIONS: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'zh-CN', label: 'Simplified Chinese', nativeLabel: '简体中文' },
  { code: 'zh-TW', label: 'Traditional Chinese', nativeLabel: '繁體中文' },
];

export default function LanguageSwitch({ variant = 'default', className = '' }: LanguageSwitchProps) {
  const { language, setLanguage } = useLanguage();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const currentLanguage = LANGUAGE_OPTIONS.find(lang => lang.code === language) || LANGUAGE_OPTIONS[0];

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setShowDropdown(false);
    
    // Update HTML lang attribute for accessibility
    if (typeof window !== 'undefined') {
      document.documentElement.lang = newLang;
    }
  };

  if (variant === 'minimal') {
    // Minimal version: Show current language code
    return (
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors ${className}`}
        aria-label="Switch Language"
      >
        <Languages className="h-4 w-4" />
        <span>{currentLanguage.nativeLabel}</span>
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      language === lang.code ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{lang.nativeLabel}</span>
                      {language === lang.code && (
                        <span className="text-primary-600">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </button>
    );
  }

  if (variant === 'dropdown') {
    // Dropdown version: Full dropdown menu
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
          aria-label="Switch Language"
        >
          <Languages className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {currentLanguage.nativeLabel}
          </span>
        </button>
        
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  Select Language
                </div>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      language === lang.code ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium ${language === lang.code ? 'text-primary-600' : 'text-gray-900'}`}>
                          {lang.nativeLabel}
                        </div>
                        <div className="text-xs text-gray-500">{lang.label}</div>
                      </div>
                      {language === lang.code && (
                        <span className="text-primary-600">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Default version: Button with language name
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
        aria-label="Switch Language"
      >
        <Languages className="h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentLanguage.nativeLabel}
        </span>
      </button>
      
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    language === lang.code ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{lang.nativeLabel}</span>
                    {language === lang.code && (
                      <span className="text-primary-600">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
