import { Zap } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-blue shadow-glow">
        <Zap className="h-5 w-5 text-white" fill="currentColor" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-white">TaskFlow</span>
    </div>
  );
}