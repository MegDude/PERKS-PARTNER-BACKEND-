import React from "react";

export const Label = React.forwardRef<HTMLLabelElement, any>(({ className, ...props }, ref) => (
  <label ref={ref} className={`text-sm font-medium leading-none ${className}`} {...props} />
));
Label.displayName = "Label";
