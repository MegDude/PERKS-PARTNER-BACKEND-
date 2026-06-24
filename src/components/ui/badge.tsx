import React from "react";

export const Badge = ({ children, variant, className = "" }: any) => (
  <span className={`px-2 py-1 text-xs font-bold rounded-none ${className}`}>
    {children}
  </span>
);
