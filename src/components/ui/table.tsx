import React from "react";

export const Table = ({ children, className }: any) => (
  <div className="w-full overflow-x-auto rounded-2xl border border-[rgba(11,31,51,0.08)] bg-white">
    <table className={`w-full min-w-[820px] table-fixed text-left text-sm ${className || ""}`}>{children}</table>
  </div>
);
export const TableHeader = ({ children, className }: any) => <thead className={`border-b border-[rgba(11,31,51,0.08)] bg-white ${className || ""}`}>{children}</thead>;
export const TableBody = ({ children, className }: any) => <tbody className={`divide-y divide-[rgba(11,31,51,0.08)] ${className || ""}`}>{children}</tbody>;
export const TableRow = ({ children, className }: any) => <tr className={`align-top hover:bg-[#FAFBFC] ${className || ""}`}>{children}</tr>;
export const TableHead = ({ children, className }: any) => <th className={`p-4 text-[11px] font-semibold uppercase tracking-normal text-[rgba(11,31,51,0.52)] ${className || ""}`}>{children}</th>;
export const TableCell = ({ children, colSpan, className }: any) => <td colSpan={colSpan} className={`p-4 text-[14px] leading-6 text-[#0B1F33] ${className || ""}`}>{children}</td>;
