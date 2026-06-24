import React from "react";

export const H1 = ({ children, className }: any) => <h1 className={`text-4xl font-bold ${className}`}>{children}</h1>;
export const H2 = ({ children, className }: any) => <h2 className={`text-3xl font-bold ${className}`}>{children}</h2>;
export const H3 = ({ children, className }: any) => <h3 className={`text-2xl font-bold ${className}`}>{children}</h3>;
export const Body = ({ children, className }: any) => <p className={`text-base ${className}`}>{children}</p>;
