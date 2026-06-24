import React from 'react';

export const Card = ({ children, className = '' }: any) => <div className={`bg-transparent mb-6 ${className}`}>{children}</div>;
export const CardHeader = ({ children, className = '' }: any) => <div className={`pb-4 mb-4 border-b border-slate-100 ${className}`}>{children}</div>;
export const CardTitle = ({ children, className = '' }: any) => <div className={`text-xl font-medium tracking-tight text-[#11182B] ${className}`}>{children}</div>;
export const CardDescription = ({ children, className = '' }: any) => <div className={`text-sm text-slate-500 mt-1 ${className}`}>{children}</div>;
export const CardContent = ({ children, className = '' }: any) => {
  return <div className={`${className.includes('p-') ? className : ''}`}>{children}</div>;
};

