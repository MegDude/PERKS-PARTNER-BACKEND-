import React from "react";

export const Table = ({ children, className }: any) => <div className="overflow-x-auto"><table className={`w-full text-left text-sm ${className}`}>{children}</table></div>;
export const TableHeader = ({ children, className }: any) => <thead className={`border-b bg-slate-50 ${className}`}>{children}</thead>;
export const TableBody = ({ children, className }: any) => <tbody className={`divide-y ${className}`}>{children}</tbody>;
export const TableRow = ({ children, className }: any) => <tr className={`hover:bg-slate-50 ${className}`}>{children}</tr>;
export const TableHead = ({ children, className }: any) => <th className={`p-4 font-bold text-slate-500 ${className}`}>{children}</th>;
export const TableCell = ({ children, colSpan, className }: any) => <td colSpan={colSpan} className={`p-4 ${className}`}>{children}</td>;
