import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const points = [
  "Projects, tasks and assignments in one place",
  "Role-based access for owners, admins, members and guests",
  "Every workspace is fully isolated from the others",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-white/[0.06] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand/25 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-brand-blue/20 blur-[110px]" />
        <Logo className="relative" />
        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white">
            Ship work, not status meetings.
          </h1>
          <p className="mt-4 text-slate-400">
            TaskFlow keeps your team aligned with clear ownership, live progress and a full activity trail.
          </p>
          <ul className="mt-8 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-light" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-600">Built with Next.js, Express, Prisma and PostgreSQL.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md animate-fade-in">
          <Logo className="mb-8 lg:hidden" />
          {children}
        </div>
      </div>
    </div>
  );
}