import { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations.js';

const LangContext = createContext(null);

const LANGS = ['uz', 'ru', 'en'];

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('lang');
    return LANGS.includes(saved) ? saved : 'uz'; // UZ default
  });

  const switchLang = (l) => {
    if (LANGS.includes(l)) {
      setLang(l);
      localStorage.setItem('lang', l);
    }
  };

  // Dot-notation lookup: t('home.title')
  const t = (key) => {
    const parts = key.split('.');
    let val = translations[lang];
    for (const part of parts) {
      val = val?.[part];
    }
    return val || key;
  };

  return (
    <LangContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
