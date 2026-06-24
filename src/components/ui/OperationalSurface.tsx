import React from 'react';

interface OperationalSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const OperationalSurface: React.FC<OperationalSurfaceProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-[rgba(255,255,255,0.58)] backdrop-blur-[18px] rounded-[18px] shadow-[0_10px_40px_rgba(11,31,51,0.05)] outline outline-1 outline-[rgba(255,255,255,0.4)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
