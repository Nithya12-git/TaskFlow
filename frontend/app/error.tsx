"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-10" />
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 ring-1 ring-red-400/20">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        An unexpected error occurred. You can try again, and if it keeps happening, refresh the page.
      </p>
      <Button className="mt-8" icon={<RefreshCw className="h-4 w-4" />} onClick={reset}>
        Try again
      </Button>
    </div>
  );
}