import { Button } from '@/components/ui/Button';
const intents = [
  "Grab coffee",
  "Find dinner",
  "Go out tonight",
  "Something new",
  "Trending nearby"
];

export default function ResidentIntentSelector({ onSelect }: { onSelect: (intent: string) => void }) {
  return (
    <div className="p-4 space-y-3 bg-[#F5F7FA] h-full flex flex-col justify-center max-w-sm mx-auto w-full">
      <h2 className="text-sm uppercase tracking-wide text-[#8e9bb0] font-bold text-center mb-4">
        What do you want to do?
      </h2>
      <div className="space-y-3">
        {intents.map((intent) => (
          <Button
            key={intent}
            onClick={() => onSelect(intent)}
            className="w-full p-4 border border-[#EFEFEF]/60 rounded-none text-left text-[#11182B] bg-white hover:bg-[#F9F8F4] transition shadow-none font-medium"
          >
            {intent}
          </Button>
        ))}
      </div>
    </div>
  );
}
