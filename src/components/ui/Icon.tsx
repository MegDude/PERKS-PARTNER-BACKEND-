import React from 'react';

export function Icon({ type }: { type: string }) {
  const icons: any = {
    coffee: "M4 6h16v10H4z",
    dining: "M6 4v16M12 4v16",
    nightlife: "M8 4h8v6H8z",
    wellness: "M6 12h12",
    retail: "M5 6h14v10H5z",
    civic: "M4 4h16v16H4z",
    property: "M6 10h12v10H6z"
  };

  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <path d={icons[type] || icons.property} stroke="#0A1422" fill="none" strokeWidth="1.5"/>
    </svg>
  );
}
