import React from "react";

export const H1 = ({ children, className }: any) => <h1 className={`text-[36px] font-semibold leading-tight tracking-normal text-[#0B1F33] ${className}`}>{children}</h1>;
export const H2 = ({ children, className }: any) => <h2 className={`text-[28px] font-semibold leading-tight tracking-normal text-[#0B1F33] ${className}`}>{children}</h2>;
export const H3 = ({ children, className }: any) => <h3 className={`text-[22px] font-semibold leading-snug tracking-normal text-[#0B1F33] ${className}`}>{children}</h3>;
export const Body = ({ children, className }: any) => <p className={`text-[16px] leading-7 text-[rgba(11,31,51,0.68)] ${className}`}>{children}</p>;
