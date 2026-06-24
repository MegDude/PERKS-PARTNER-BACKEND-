import { Button } from '@/components/ui/Button';

export default function ReferralOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col justify-center items-center p-6">
      <div className="w-16 h-16 bg-[#11182B]/10 text-[#11182B] rounded-none flex items-center justify-center mb-6">
         <span className="text-3xl">✨</span>
      </div>
      <h2 className="text-xl font-bold mb-2 text-[#11182B] text-center">
        Bring a neighbor next time
      </h2>
      <p className="text-sm text-[#8e9bb0] mb-8 text-center max-w-xs">
        You both get an exclusive neighborhood perk when they join.
      </p>
      <Button className="w-full max-w-sm py-3 text-base">
        Send invite
      </Button>
      <Button onClick={onClose} className="mt-4 text-xs font-bold uppercase tracking-wider text-[#8e9bb0] hover:text-[#11182B] transition-colors p-2">
        Skip
      </Button>
    </div>
  );
}
