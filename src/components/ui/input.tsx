import React from "react";

export const Input = React.forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => (
  <input 
    ref={ref} 
    className={`w-full px-0 py-2 border-0 border-b border-slate-300 rounded-none focus:ring-0 focus:border-[#C5A028] bg-transparent text-sm transition-colors ${className}`} 
    {...props} 
  />
));
Input.displayName = "Input";
