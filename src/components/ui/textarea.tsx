import React from "react";

export const Textarea = React.forwardRef<HTMLTextAreaElement, any>(({ className, ...props }, ref) => (
  <textarea 
    ref={ref} 
    className={`min-h-[120px] w-full resize-y rounded-none border-0 border-b border-[rgba(11,31,51,0.18)] bg-white px-0 py-3 text-[15px] leading-6 text-[#0B1F33] transition-colors placeholder:text-[rgba(11,31,51,0.42)] focus:border-[#C8A96A] focus:outline-none focus:ring-0 ${className}`} 
    {...props} 
  />
));
Textarea.displayName = "Textarea";
