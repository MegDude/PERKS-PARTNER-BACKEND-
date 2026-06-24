import React from 'react';
import { Button } from '@/components/ui/Button';

export default function ResidentProfileModal({ resident, open, onOpenChange }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-white p-6 rounded-none max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-[#11182B] ">Resident Profile</h2>
        {resident && (
          <div className="space-y-2 text-[#11182B] ">
            <p><strong>Name:</strong> {resident.name}</p>
            <p><strong>Email:</strong> {resident.email}</p>
            {resident.mobile_number && <p><strong>Phone:</strong> {resident.mobile_number}</p>}
            <p><strong>Perks Tier:</strong> <span className="capitalize">{resident.perks_tier || 'None'}</span></p>
          </div>
        )}
        <Button className="mt-6 w-full px-4 py-2 bg-[#11182B] hover:bg-[#11182B]/90 text-white font-bold rounded-none transition-colors cursor-pointer" onClick={() => onOpenChange(false)}>Close</Button>
      </div>
    </div>
  );
}
