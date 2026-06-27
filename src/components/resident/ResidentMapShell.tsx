import { useState, useEffect } from 'react';
import ResidentWelcomeScreen from './ResidentWelcomeScreen';
import ResidentIntentSelector from './ResidentIntentSelector';
import ReferralOverlay from './ReferralOverlay';
import ResidentPerkActivationFlow from './ResidentPerkActivationFlow';
import { Button } from "../ui/Button";
import { MapPin } from 'lucide-react';

export default function ResidentMapShell() {
  const [step, setStep] = useState("welcome");
  const [showReferral, setShowReferral] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [perkActivated, setPerkActivated] = useState(false);

  useEffect(() => {
    if (perkActivated) {
      setShowReferral(true);
    }
  }, [perkActivated]);

  const highlightEntity = {
    id: "perk_1",
    name: "Joe's Coffee",
    title: "Free Small Coffee at Joe's",
    category: "Food & Beverage",
  };

  const saveEntity = (entity: any) => {
    if (!entity?.id) return;
    window.localStorage.setItem(`dp-saved-${entity.id}`, JSON.stringify({ id: entity.id, name: entity.name, saved_at: new Date().toISOString() }));
  };

  const triggerReminder = (entity: any) => {
    if (!entity?.id) return;
    window.localStorage.setItem(`dp-reminder-${entity.id}`, JSON.stringify({ id: entity.id, name: entity.name, reminder_at: new Date().toISOString() }));
  };

  if (step === "welcome") return <ResidentWelcomeScreen onStart={() => setStep("intent")} />;
  if (step === "intent") return <ResidentIntentSelector onSelect={() => setStep("map")} />;

  return (
    <div className="h-full bg-[#11182B] relative flex flex-col font-sans rounded-none overflow-hidden">
      {/* Map Background Placeholder */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-[#1a243d] flex items-center justify-center relative overflow-hidden">
             {/* Decorative Map Lines */}
             <svg className="absolute w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 200 Q 200 300 400 200 T 800 200" stroke="#C5A028" strokeWidth="2" fill="none" />
                <path d="M 0 400 Q 300 100 600 400 T 1000 400" stroke="#C5A028" strokeWidth="2" fill="none" />
             </svg>
             <MapPin className="w-10 h-10 text-[#11182B] absolute top-1/3 left-[40%]" />
             
             {/* Map point glowing */}
             <div className="absolute top-1/3 left-[40%] w-10 h-10 bg-[#11182B] text-white rounded-none blur-[20px] opacity-40 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      <div className="z-10 flex-1 p-4 flex flex-col justify-end pointer-events-none">
        
        {/* Entity Card */}
        <div className="mb-4 w-full bg-white p-5 rounded-none shadow-none border border-[#EFEFEF]/60 pointer-events-auto transform transition-all duration-500 translate-y-0">
          <p className="text-[10px] uppercase text-[#8e9bb0] mb-3 font-bold tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-none bg-[#11182B] text-white animate-pulse"></span>
            Trending nearby
          </p>

          <div className="mb-6">
            <h3 className="font-bold text-[#11182B] text-xl leading-tight mb-1">{highlightEntity.name}</h3>
            <p className="text-sm text-slate-600 mb-3">{highlightEntity.title}</p>
            <span className="text-[9px] font-bold text-[#11182B] uppercase tracking-wider bg-[#11182B]/10 border border-[#11182B]/30 px-2 py-1.5 rounded-none inline-block">
              {highlightEntity.category}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="w-full bg-[#11182B] text-white py-3 rounded-none shadow-none font-semibold text-sm h-12 flex grid-cols-1 items-center justify-center"
              onClick={() => {
                setShowActivation(true);
              }}
            >
              Access Perk Now
            </Button>
            <Button
              className="w-full bg-[#F5F7FA] text-[#11182B] hover:bg-[#e4e9f0] border-transparent rounded-none py-3 font-semibold text-sm shadow-none h-12 flex grid-cols-1 items-center justify-center"
              onClick={() => {
                saveEntity(highlightEntity);
                triggerReminder(highlightEntity);
              }}
            >
              Save Details
            </Button>
          </div>
        </div>
      </div>

      {showActivation && (
        <ResidentPerkActivationFlow 
          perk={highlightEntity} 
          onClose={() => setShowActivation(false)}
          onSuccess={() => {
            setShowActivation(false);
            setPerkActivated(true);
          }}
        />
      )}

      {showReferral && (
        <ReferralOverlay onClose={() => setShowReferral(false)} />
      )}
    </div>
  );
}
