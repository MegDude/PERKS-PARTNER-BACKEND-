import React, { useEffect, useState } from "react";

export const Tabs = ({ defaultValue, value, onValueChange, children, className }: any) => {
  const [active, setActive] = useState(value || defaultValue);

  useEffect(() => {
    if (value !== undefined && value !== active) {
      setActive(value);
    }
  }, [active, value]);

  const handleValueChange = (val: string) => {
    setActive(val);
    onValueChange?.(val);
  };
  return <div className={className}>{React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child as any, { active, handleValueChange }) : child)}</div>;
};

export const TabsList = ({ children, className }: any) => <div role="tablist" className={`mb-6 flex max-w-full gap-3 overflow-x-auto border-b border-[rgba(11,31,51,0.08)] pb-px ${className}`}>{children}</div>;
export const TabsTrigger = ({ value, active, handleValueChange, children, className }: any) => (
  <button 
    type="button"
    role="tab"
    aria-selected={active === value}
    aria-controls={`tab-panel-${value}`}
    id={`tab-${value}`}
    data-state={active === value ? 'active' : 'inactive'}
    onClick={() => handleValueChange?.(value)} 
    className={`min-h-11 flex-none border-b-2 bg-transparent px-0 pb-3 pt-2 text-[12px] font-semibold leading-none text-[rgba(11,31,51,0.58)] transition-colors hover:text-[#0B1F33] focus:outline-none focus:ring-2 focus:ring-[#11182B] focus:ring-offset-2 ${active === value ? "border-[#C8A96A] text-[#0B1F33]" : "border-transparent"} ${className}`}
  >
    {children}
  </button>
);
export const TabsContent = ({ value, active, children, className }: any) => {
  if (value !== active) return null;
  return <div role="tabpanel" id={`tab-panel-${value}`} aria-labelledby={`tab-${value}`} className={className}>{children}</div>;
};
