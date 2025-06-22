// Create a new file: QuranFontContext.js
import React, { createContext, useState, useContext } from 'react';

const QuranFontContext = createContext();

export const QuranFontProvider = ({ children }) => {
  const [quranFontSize, setQuranFontSize] = useState(() => {
    return parseInt(localStorage.getItem('quranFontSize')) || 20; // Default 20px
  });

  const updateQuranFontSize = (size) => {
    const newSize = Math.max(16, Math.min(30, size)); // Limit to 16-30px
    setQuranFontSize(newSize);
    localStorage.setItem('quranFontSize', newSize);
  };

  return (
    <QuranFontContext.Provider value={{ quranFontSize, updateQuranFontSize }}>
      {children}
    </QuranFontContext.Provider>
  );
};

export const useQuranFont = () => useContext(QuranFontContext);