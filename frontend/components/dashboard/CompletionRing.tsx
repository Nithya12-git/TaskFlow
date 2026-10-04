"use client";

import { useEffect, useState } from "react";

export function CompletionRing({ percent, label }: { percent: number; label: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setShown(percent), 80);
    return () => clearTimeout(t);
  }, [percent]);

  const r = 52;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative mx-auto h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * shown) / 100}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-white">{percent}%</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
    </div>
  );
}