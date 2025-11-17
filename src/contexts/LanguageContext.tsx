/**
 * 语言上下文 - 管理整个应用的语言设置
 * Language Context - Manages language settings for the entire app
 * Supports: en, zh-CN, zh-TW
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { translations, Language, Translations } from '@/config/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Valid language codes
const VALID_LANGUAGES: Language[] = ['en', 'zh-CN', 'zh-TW'];

// Language detection helper
function detectLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'en'; // Default for SSR
  }

  // Try to get from localStorage first
  const savedLanguage = localStorage.getItem('language') as Language;
  if (savedLanguage && VALID_LANGUAGES.includes(savedLanguage)) {
    return savedLanguage;
  }

  // Detect from browser
  const browserLang = navigator.language.toLowerCase();
  
  // Check for Traditional Chinese (Taiwan, Hong Kong, Macau)
  if (browserLang === 'zh-tw' || browserLang === 'zh-hk' || browserLang === 'zh-mo') {
    return 'zh-TW';
  }
  
  // Check for Simplified Chinese
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  
  // Default to English
  return 'en';
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return detectLanguage();
    }
    return 'en';
  });

  // Initialize: Load saved language preference
  useEffect(() => {
    const detected = detectLanguage();
    setLanguageState(detected);
  }, []);

  // Set language and persist to localStorage
  const setLanguage = useCallback((lang: Language) => {
    if (!VALID_LANGUAGES.includes(lang)) {
      console.warn(`Invalid language: ${lang}. Falling back to 'en'.`);
      lang = 'en';
    }
    
    setLanguageState(lang);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      
      // Force a re-render by dispatching a custom event
      window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
    }
  }, []);

  // Listen for language changes from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'language' && e.newValue) {
        const newLang = e.newValue as Language;
        if (VALID_LANGUAGES.includes(newLang)) {
          setLanguageState(newLang);
        }
      }
    };

    const handleLanguageChange = (e: CustomEvent) => {
      const newLang = e.detail.language as Language;
      if (VALID_LANGUAGES.includes(newLang)) {
        setLanguageState(newLang);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('languagechange', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languagechange', handleLanguageChange as EventListener);
    };
  }, []);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom Hook - Use language functionality in components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
