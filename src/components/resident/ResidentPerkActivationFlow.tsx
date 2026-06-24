import { Button } from '@/components/ui/Button';

export default function ResidentPerkActivationFlow({ perk, onClose, onSuccess }: { perk: any, onClose: () => void, onSuccess: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#11182B] z-50 flex flex-col justify-center items-center p-6 text-white isolate overflow-hidden">
      {/* Background flare */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#11182B] text-white opacity-20 blur-[100px] rounded-none pointer-events-none transform translate-y-[-50%] translate-x-[50%]"></div>
      
      <h2 className="text-2xl font-bold mb-2">Show your pass</h2>
      <p className="text-sm text-[#8e9bb0] mb-8">{perk.title}</p>
      
      <div className="w-64 h-64 bg-white rounded-none mb-8 flex items-center justify-center p-4 relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#C5A028] to-[#11182B] rounded-none blur z-[-1] opacity-50"></div>
        <div className="w-full h-full border-2 border-dashed border-[#8e9bb0]/50 rounded-none flex flex-col items-center justify-center text-[#11182B] font-mono text-xs gap-2">
          <div className="w-32 h-32 bg-[#11182B] flex items-center justify-center rounded">
              <span className="text-white text-xs opacity-50">QR</span>
          </div>
          SCAN TO REDEEM
        </div>
      </div>
      
      <Button 
        className="w-full max-w-sm bg-[#11182B] text-white hover:bg-[#b0956d] py-3 text-base shadow-[0_0_20px_rgba(198,168,124,0.3)] transition-all" 
        onClick={onSuccess}
      >
        Simulate Success
      </Button>
      <Button onClick={onClose} className="mt-4 text-xs font-bold uppercase tracking-wider text-[#8e9bb0] hover:text-white transition-colors p-2">
        Close / Cancel
      </Button>
    </div>
  );
}
