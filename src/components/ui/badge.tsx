import React from "react";

export const Badge = ({ children, variant, className = "" }: any) => (
  <span className={`inline-flex min-h-7 items-center rounded-full border border-[rgba(11,31,51,0.10)] bg-white px-2.5 py-1 text-[12px] font-semibold leading-none text-[#0B1F33] ${className}`}>
    {children}
  </span>
);
