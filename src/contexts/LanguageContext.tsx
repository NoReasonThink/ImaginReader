import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en-US';
import zh from '../locales/zh-CN';

type Language = 'en' | 'zh';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = '@app_language';

const translations = {
  en,
  zh
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('zh'); // Default to Chinese as requested

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLang && (storedLang === 'en' || storedLang === 'zh')) {
        setLanguage(storedLang as Language);
      }
    } catch (error) {
      console.error('Failed to load language', error);
    }
  };

  const handleSetLanguage = async (lang: Language) => {
    setLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const t = (key: keyof Translations) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
