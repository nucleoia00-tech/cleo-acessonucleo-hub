import { Brain } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-bold text-xl ${className}`}>
      <div className="relative">
        <Brain className="w-8 h-8 text-primary" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-primary via-accent to-secondary rounded-full animate-pulse" />
      </div>
      <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
        Núcleo IA
      </span>
    </div>
  );
}