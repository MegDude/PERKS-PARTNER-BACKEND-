import React, { useState } from "react";
import { Button } from '@/components/ui/Button';

export const Tabs = ({ defaultValue, value, onValueChange, children, className }: any) => {
  const [active, setActive] = useState(value || defaultValue);
  const handleValueChange = (val: string) => {
    setActive(val);
    onValueChange?.(val);
  };
  return <div className={className}>{React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child as any, { active, handleValueChange }) : child)}</div>;
};

export const TabsList = ({ children, className }: any) => <div className={`flex flex-wrap gap-3 mb-6 border-b border-[#EFEFEF] pb-px ${className}`}>{children}</div>;
export const TabsTrigger = ({ value, active, handleValueChange, children, className }: any) => (
  <button 
    onClick={() => handleValueChange?.(value)} 
    className={`flex-none pb-3 text-[10px] font-semibold transition-colors border-b-2 ${active === value ? "border-[#C5A028] text-[#C5A028]" : "border-transparent text-slate-400 hover:text-[#11182B]"} ${className}`}
  >
    {children}
  </button>
);
export const TabsContent = ({ value, active, children, className }: any) => {
  if (value !== active) return null;
  return <div className={className}>{children}</div>;
};
