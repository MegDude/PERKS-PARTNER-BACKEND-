import { Button } from "../ui/Button";

export default function ResidentWelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="h-full flex flex-col justify-center items-center px-6 bg-[#F5F7FA]">
      <h1 className="text-2xl font-semibold text-[#11182B] text-center mb-2">
        Your downtown, in one map.
      </h1>
      <p className="text-sm text-[#8e9bb0] text-center mb-6">
        Find what’s happening nearby — and use it instantly.
      </p>
      <Button onClick={onStart} className="w-full max-w-sm py-3 text-base">
        Open the map
      </Button>
    </div>
  );
}
