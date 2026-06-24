import React, { createContext, useContext, useState, useEffect } from 'react';

const currencies = {
  INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR' },
  SAR: { symbol: 'ر.س', name: 'Saudi Riyal', code: 'SAR' },
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', code: 'AED' },
};

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    const saved = localStorage.getItem('currency');
    if (saved && currencies[saved]) {
      setCurrency(saved);
    }
  }, []);

  const changeCurrency = (newCurrency) => {
    if (currencies[newCurrency]) {
      setCurrency(newCurrency);
      localStorage.setItem('currency', newCurrency);
    }
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '-';
    const curr = currencies[currency];
    return `${curr.symbol}${amount.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      changeCurrency, 
      currencies,
      currentCurrency: currencies[currency],
      formatAmount
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};