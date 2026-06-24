import React from "react";

export const Checkbox = React.forwardRef<HTMLInputElement, any>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <input 
    type="checkbox" 
    ref={ref} 
    checked={checked} 
    onChange={(e) => onCheckedChange?.(e.target.checked)} 
    className={`w-4 h-4 rounded border-slate-300 text-[#11182B] focus:ring-[#11182B] ${className}`} 
    {...props} 
  />
));
Checkbox.displayName = "Checkbox";
