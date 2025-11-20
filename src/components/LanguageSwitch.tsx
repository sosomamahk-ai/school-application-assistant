/**
 * Language Switch Component
 * Fixed with Portal for proper dropdown positioning
 * Always opens downward, never clipped
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/contexts/TranslationContext';
import { ChevronDown } from 'lucide-react';
import type { Language } from '@/lib/translations';

interface LanguageSwitchProps {
  variant?: 'default' | 'minimal' | 'dropdown';
  className?: string;
}

const LANGUAGE_OPTIONS: {
  code: Language;
  label: string;
  nativeLabel: string;
  shortLabel: string;
  flag: string;
}[] = [
  { code: 'zh-CN', label: 'Simplified Chinese', nativeLabel: '简体中文', shortLabel: '简体', flag: '🇨🇳' },
  { code: 'zh-TW', label: 'Traditional Chinese', nativeLabel: '繁體中文', shortLabel: '繁体', flag: '🇭🇰' },
  { code: 'en', label: 'English', nativeLabel: 'English', shortLabel: '英文', flag: '🇺🇸' },
];

export default function LanguageSwitch({ variant = 'default', className = '' }: LanguageSwitchProps) {
  const { language, setLanguage } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const currentLanguage = LANGUAGE_OPTIONS.find(lang => lang.code === language) || LANGUAGE_OPTIONS[0];
  const getShortLabel = (lang = currentLanguage) => lang.shortLabel || lang.nativeLabel || lang.label;

  // Calculate dropdown position
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + window.scrollY + 8, // 8px gap
        left: buttonRect.left + window.scrollX,
        width: buttonRect.width,
      });
    }
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: Event) {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        dropdownRef.current &&
        !buttonRef.current.contains(target) &&
        !dropdownRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showDropdown]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && showDropdown) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showDropdown]);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setShowDropdown(false);
  };

  const DropdownContent = () => (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px]"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${Math.max(dropdownPosition.width, 200)}px`,
      }}
    >
      <div className="py-1">
        {LANGUAGE_OPTIONS.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
              language === lang.code
                ? 'bg-primary-50 text-primary-600 font-medium'
                : 'text-gray-700'
            }`}
          >
            <span className="flex items-center space-x-2">
              <span className="text-lg leading-none">{lang.flag}</span>
              <span>{lang.shortLabel}</span>
            </span>
            {language === lang.code && (
              <span className="text-primary-600">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  if (variant === 'minimal') {
    return (
      <>
        <div className={`relative ${className}`}>
          <button
            ref={buttonRef}
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
            aria-label={`切换语言：${currentLanguage.label}`}
            aria-expanded={showDropdown}
          >
            <span className="text-lg leading-none">{currentLanguage.flag}</span>
            <span>{getShortLabel()}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {showDropdown &&
          typeof window !== 'undefined' &&
          createPortal(<DropdownContent />, document.body)}
      </>
    );
  }

  if (variant === 'dropdown') {
    return (
      <>
        <div className={`relative ${className}`}>
          <button
            ref={buttonRef}
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            aria-label={`切换语言：${currentLanguage.label}`}
            aria-expanded={showDropdown}
          >
            <span className="text-xl leading-none">{currentLanguage.flag}</span>
            <span className="text-sm font-medium text-gray-700">
              {getShortLabel()}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {showDropdown &&
          typeof window !== 'undefined' &&
          createPortal(<DropdownContent />, document.body)}
      </>
    );
  }

  // Default version
  return (
    <>
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-3 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
          aria-label={`切换语言：${currentLanguage.label}`}
          aria-expanded={showDropdown}
        >
          <span className="text-xl leading-none">{currentLanguage.flag}</span>
          <span className="text-sm font-medium text-gray-700">
            {getShortLabel()}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {showDropdown &&
        typeof window !== 'undefined' &&
        createPortal(<DropdownContent />, document.body)}
    </>
  );
}
