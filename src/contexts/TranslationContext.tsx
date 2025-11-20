/**
 * Unified Translation Context
 * Provides t(key) function for all components
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language, TranslationData, translations as defaultTranslations, loadTranslations } from '@/lib/translations';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translations: TranslationData;
  reloadTranslations: () => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

const VALID_LANGUAGES: Language[] = ['en', 'zh-CN', 'zh-TW'];

function detectLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'zh-CN';
  }

  const savedLanguage = localStorage.getItem('language') as Language;
  if (savedLanguage && VALID_LANGUAGES.includes(savedLanguage)) {
    return savedLanguage;
  }

  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang === 'zh-tw' || browserLang === 'zh-hk' || browserLang === 'zh-mo') {
    return 'zh-TW';
  }
  
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  
  return 'en';
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [language, setLanguageState] = useState<Language>('zh-CN');

  const [translations, setTranslations] = useState<TranslationData>(defaultTranslations);

  // Detect preferred language once we're on the client to avoid hydration mismatch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLanguageState(detectLanguage());
  }, []);

  // Load translations on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadTranslations().then(setTranslations);
    }
  }, []);

  // Reload translations function
  const reloadTranslations = useCallback(async () => {
    const loaded = await loadTranslations();
    setTranslations(loaded);
  }, []);

  // Set language and persist
  const setLanguage = useCallback((lang: Language) => {
    if (!VALID_LANGUAGES.includes(lang)) {
      console.warn(`Invalid language: ${lang}. Falling back to 'en'.`);
      lang = 'en';
    }
    
    setLanguageState(lang);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      document.documentElement.lang = lang;
      window.dispatchEvent(new CustomEvent('languagechange', { detail: { language: lang } }));
    }
  }, []);

  // Listen for language changes from other tabs
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

  // Translation function
  const t = useCallback((key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translation[language] || translation.en || key;
  }, [language, translations]);

  // Update HTML lang attribute
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value: TranslationContextType = {
    language,
    setLanguage,
    t,
    translations,
    reloadTranslations,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

// Hook for using translations
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

export default TranslationContext;

