import React from "react";
import { Button } from '@/components/ui/Button';

export const AlertDialog = ({ open, onOpenChange, children }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange?.(false)}>
      <div className="bg-white p-6 rounded-none w-full max-w-sm" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};
export const AlertDialogContent = ({ children, className }: any) => <div className={className}>{children}</div>;
export const AlertDialogHeader = ({ children, className }: any) => <div className={`mb-4 ${className}`}>{children}</div>;
export const AlertDialogTitle = ({ children, className }: any) => <h2 className={`text-lg font-bold ${className}`}>{children}</h2>;
export const AlertDialogDescription = ({ children, className }: any) => <p className={`text-sm text-slate-500 ${className}`}>{children}</p>;
export const AlertDialogFooter = ({ children, className }: any) => <div className={`mt-6 flex justify-end gap-2 ${className}`}>{children}</div>;
export const AlertDialogCancel = ({ children, onClick, className }: any) => <Button variant="outline" onClick={onClick} className={className}>{children}</Button>;
export const AlertDialogAction = ({ children, onClick, className }: any) => <Button variant="primary" onClick={onClick} className={className}>{children}</Button>;
