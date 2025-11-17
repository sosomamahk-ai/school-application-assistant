/**
 * Language Switch Component
 * Fixed dropdown positioning - opens downward, properly aligned
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { Languages } from 'lucide-react';
import type { Language } from '@/lib/translations';

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
  const { language, setLanguage } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentLanguage = LANGUAGE_OPTIONS.find(lang => lang.code === language) || LANGUAGE_OPTIONS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  // Adjust dropdown position if needed (prevent overflow)
  useEffect(() => {
    if (showDropdown && dropdownRef.current && buttonRef.current) {
      const dropdown = dropdownRef.current;
      const button = buttonRef.current;
      const rect = button.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Reset any previous adjustments
      dropdown.style.top = '';
      dropdown.style.bottom = '';
      dropdown.style.left = '';
      dropdown.style.right = '';

      // Check if dropdown goes below viewport
      if (rect.bottom + dropdownRect.height > viewportHeight) {
        // Position above button instead
        dropdown.style.bottom = '100%';
        dropdown.style.top = 'auto';
        dropdown.style.marginBottom = '0.5rem';
        dropdown.style.marginTop = '0';
      } else {
        // Position below button (default)
        dropdown.style.top = '100%';
        dropdown.style.bottom = 'auto';
        dropdown.style.marginTop = '0.5rem';
        dropdown.style.marginBottom = '0';
      }

      // Check if dropdown goes beyond right edge
      if (rect.right > viewportWidth - dropdownRect.width) {
        dropdown.style.right = '0';
        dropdown.style.left = 'auto';
      } else {
        dropdown.style.left = '0';
        dropdown.style.right = 'auto';
      }
    }
  }, [showDropdown]);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setShowDropdown(false);
  };

  if (variant === 'minimal') {
    return (
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
          aria-label="Switch Language"
        >
          <Languages className="h-4 w-4" />
          <span>{currentLanguage.nativeLabel}</span>
        </button>
        
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute left-0 z-50 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200"
          >
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
        )}
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
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
          <div
            ref={dropdownRef}
            className="absolute left-0 z-50 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200"
          >
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
        )}
      </div>
    );
  }

  // Default version
  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
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
        <div
          ref={dropdownRef}
          className="absolute left-0 z-50 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200"
        >
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
      )}
    </div>
  );
}
