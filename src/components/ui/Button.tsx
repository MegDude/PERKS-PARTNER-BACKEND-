import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({ 
  variant = "primary", 
  className = "", 
  children, 
  loading = false,
  disabled = false,
  ...props 
}: any) {
  
  const base = "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans transition-all focus:outline-none focus:ring-2 focus:ring-[#11182B] focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 [&>svg]:shrink-0";

  const variants: any = {
    primary: "bg-[#11182B] text-white hover:bg-[#1a243d] border border-[#11182B] px-4 py-2 text-[10px] font-semibold rounded-none shadow-none",
    secondary: "bg-[#F8F9FA] text-[#11182B] hover:bg-[#EFEFEF] border border-[#EFEFEF] hover:border-slate-300 px-4 py-2 text-[10px] font-semibold rounded-none",
    outline: "bg-transparent text-[#11182B] hover:bg-slate-50 border border-[#11182B] px-4 py-2 text-[10px] font-semibold rounded-none",
    ghost: "bg-transparent text-[#11182B] hover:bg-slate-100 border border-transparent hover:text-[#11182B] px-3 py-2 text-[10px] font-semibold rounded-none",
    subtle: "bg-transparent text-slate-500 hover:text-[#11182B] hover:bg-slate-50 border border-transparent px-3 py-2 min-h-0 text-[10px] font-semibold rounded-none",
    destructive: "bg-white text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 px-4 py-2 text-[10px] font-semibold rounded-none",
    "map-floating": "bg-white/90 backdrop-blur-md text-[#11182B] border border-[#EFEFEF]/50 shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:bg-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] px-4 py-2 text-[10px] font-semibold rounded-none",
    "dashboard-action": "bg-transparent border border-[#EFEFEF] text-[#11182B] text-[10px] font-semibold hover:border-[#11182B] hover:bg-slate-50 px-4 py-2 rounded-none flex items-center justify-center gap-2",
    "map-action": "bg-[var(--dp-navy)] text-[var(--dp-pearl)] border border-transparent hover:border-[var(--dp-gold)] py-2 px-4 text-[10px] font-semibold rounded-none",
    "resident-action": "bg-[var(--dp-navy)] text-[var(--dp-pearl)] border border-transparent hover:border-[var(--dp-gold)] py-2 px-4 text-[10px] font-semibold rounded-none",
  };

  const finalClassName = cn(base, variants[variant] || variants.primary, className);

  return (
    <button className={finalClassName} disabled={disabled || loading} {...props}>
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
