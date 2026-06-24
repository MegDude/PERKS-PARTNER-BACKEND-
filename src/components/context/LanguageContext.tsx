import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext({
  t: (key: string) => key,
  isRTL: false,
  setLanguage: (lang: string) => {}
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <LanguageContext.Provider value={{ t: (k) => k, isRTL: false, setLanguage: () => {} }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
