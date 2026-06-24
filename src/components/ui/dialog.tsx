import React from "react";

export const Dialog = ({ open, onOpenChange, children }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange?.(false)}>
      <div className="bg-white p-6 rounded-none w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};
export const DialogContent = ({ children, className }: any) => <div className={className}>{children}</div>;
export const DialogHeader = ({ children, className }: any) => <div className={`mb-4 ${className}`}>{children}</div>;
export const DialogTitle = ({ children, className }: any) => <h2 className={`text-xl font-bold ${className}`}>{children}</h2>;
export const DialogFooter = ({ children, className }: any) => <div className={`mt-6 flex justify-end gap-2 ${className}`}>{children}</div>;
