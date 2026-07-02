import React from 'react';

export type QuickViewMetric = {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
};

export function QuickViewTable({ label, metrics, className = '' }: { label: string; metrics: QuickViewMetric[]; className?: string }) {
  return (
    <div className={`overflow-x-auto border border-[rgba(11,31,51,0.08)] bg-white ${className}`} aria-label={label}>
      <table className="min-w-full text-left">
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.label} className="border-b border-[rgba(11,31,51,0.05)] last:border-b-0">
              <th scope="row" className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#C8A96A]">
                {metric.label}
              </th>
              <td className="whitespace-nowrap px-3 py-2 text-[13px] font-semibold text-[#0B1F33]">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              </td>
              <td className="min-w-[150px] px-3 py-2 text-[11px] leading-4 text-[rgba(11,31,51,0.62)]">
                {metric.detail || ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
