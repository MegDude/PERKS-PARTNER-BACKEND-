import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({ 
  variant = "primary", 
  className = "", 
  children, 
  loading = false,
  disabled = false,
  type = "button",
  ...props 
}: any) {
  
  const base = "relative inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap font-sans text-[11px] font-semibold leading-none text-[#0B1F33] transition-all focus:outline-none focus:ring-2 focus:ring-[#C8A96A] focus:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0";

  const variants: any = {
    primary: "bg-white text-[#0B1F33] hover:bg-white border border-[rgba(11,31,51,0.18)] hover:border-[#C8A96A] px-3.5 py-2 rounded-[8px] shadow-none",
    secondary: "bg-white text-[#0B1F33] hover:bg-white border border-[rgba(11,31,51,0.12)] hover:border-[#C8A96A] px-3.5 py-2 rounded-[8px] shadow-none",
    outline: "bg-white text-[#0B1F33] hover:bg-white border border-[rgba(11,31,51,0.14)] hover:border-[#C8A96A] px-3.5 py-2 rounded-[8px] shadow-none",
    ghost: "bg-transparent text-[#0B1F33] hover:bg-white border border-transparent hover:border-[rgba(11,31,51,0.08)] px-3 py-2 rounded-[8px] shadow-none",
    subtle: "bg-transparent text-[rgba(11,31,51,0.62)] hover:text-[#0B1F33] hover:bg-white border border-transparent px-3 py-2 rounded-[8px] shadow-none",
    destructive: "bg-white text-red-600 hover:bg-white border border-red-200 hover:border-red-300 px-3.5 py-2 rounded-[8px] shadow-none",
    "map-floating": "bg-white/95 text-[#0B1F33] border border-[rgba(11,31,51,0.12)] shadow-[0_18px_50px_rgba(11,31,51,0.08)] hover:border-[#C8A96A] px-3.5 py-2 rounded-[8px]",
    "dashboard-action": "bg-white border border-[rgba(11,31,51,0.12)] text-[#0B1F33] hover:border-[#C8A96A] hover:bg-white px-3.5 py-2 rounded-[8px] shadow-none",
    "map-action": "bg-white text-[var(--dp-navy)] border border-[rgba(11,31,51,0.14)] hover:border-[var(--dp-gold)] py-2 px-3.5 rounded-[8px] shadow-none",
    "resident-action": "bg-white text-[var(--dp-navy)] border border-[rgba(11,31,51,0.14)] hover:border-[var(--dp-gold)] py-2 px-3.5 rounded-[8px] shadow-none",
  };

  const finalClassName = cn(base, className, variants[variant] || variants.primary);

  return (
    <button type={type} className={finalClassName} disabled={disabled || loading} {...props}>
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
          <span className="opacity-0">{children}</span> {/* Keep button width stable */}
          <span className="absolute inset-0 flex items-center justify-center">Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
