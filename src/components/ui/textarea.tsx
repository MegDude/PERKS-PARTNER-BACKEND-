import React from "react";

export const Textarea = React.forwardRef<HTMLTextAreaElement, any>(({ className, ...props }, ref) => (
  <textarea 
    ref={ref} 
    className={`min-h-[80px] w-full rounded-none border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-[#C5A028] resize-y transition-colors ${className}`} 
    {...props} 
  />
));
Textarea.displayName = "Textarea";
