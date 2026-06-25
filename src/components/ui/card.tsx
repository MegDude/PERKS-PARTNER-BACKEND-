import React from 'react';

export const Card = ({ children, className = '' }: any) => <section className={`bg-white border border-[rgba(11,31,51,0.08)] rounded-2xl p-6 shadow-none ${className}`}>{children}</section>;
export const CardHeader = ({ children, className = '' }: any) => <div className={`mb-5 border-b border-[rgba(11,31,51,0.08)] pb-4 ${className}`}>{children}</div>;
export const CardTitle = ({ children, className = '' }: any) => <h3 className={`text-[22px] font-semibold leading-tight tracking-normal text-[#0B1F33] ${className}`}>{children}</h3>;
export const CardDescription = ({ children, className = '' }: any) => <p className={`mt-2 text-[14px] leading-6 text-[rgba(11,31,51,0.62)] ${className}`}>{children}</p>;
export const CardContent = ({ children, className = '' }: any) => {
  return <div className={`${className}`}>{children}</div>;
};
