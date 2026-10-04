import { Compass } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-10" />
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand-blue/20 text-brand-light ring-1 ring-white/10">
        <Compass className="h-7 w-7" />
      </div>
      <p className="text-sm font-medium text-brand-light">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <LinkButton href="/dashboard" className="mt-8">
        Back to dashboard
      </LinkButton>
    </div>
  );
}