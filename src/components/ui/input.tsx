import React from "react";

export const Input = React.forwardRef<HTMLInputElement, any>(({ className, ...props }, ref) => (
  <input 
    ref={ref} 
    className={`w-full rounded-none border-0 border-b border-[rgba(11,31,51,0.18)] bg-white px-0 py-3 text-[15px] leading-6 text-[#0B1F33] transition-colors placeholder:text-[rgba(11,31,51,0.42)] focus:border-[#C8A96A] focus:outline-none focus:ring-0 ${className}`} 
    {...props} 
  />
));
Input.displayName = "Input";
