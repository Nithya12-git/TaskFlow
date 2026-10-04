"use client";

import { Check, CreditCard, Lock, Receipt } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badges";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

interface BillingData {
  plan: {
    id: string;
    name: string;
    priceMonthly: number;
    currency: string;
    features: string[];
    limits: { members: number; projects: number; tasks: number };
  };
  usage: { members: number; projects: number; tasks: number };
  paymentMethod: null | { brand: string; last4: string };
  invoices: Array<{ id: string; date: string; amount: number; status: string }>;
}

const PLANS = [
  { id: "starter", name: "Starter", price: "$0", blurb: "For small teams getting started.", features: ["Up to 10 members", "25 projects", "500 tasks"] },
  { id: "pro", name: "Pro", price: "$12", blurb: "For growing teams that need more room.", features: ["Up to 50 members", "Unlimited projects", "10,000 tasks"] },
  { id: "business", name: "Business", price: "$29", blurb: "For organizations with advanced needs.", features: ["Unlimited members", "Unlimited projects", "Priority support"] },
];

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const tone = pct >= 100 ? "from-red-500 to-red-400" : pct >= 80 ? "from-amber-500 to-amber-400" : "from-brand to-brand-blue";
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">
          <span className="font-medium text-slate-100">{used}</span> / {limit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function BillingPage() {
  const { can } = useAuth();
  const allowed = can("billing:manage");
  const { data, error, loading, retry } = useApi<BillingData>(allowed ? "/billing" : null);

  if (!allowed) {
    return (
      <>
        <PageHeader title="Billing" description="Plan, usage and invoices." />
        <EmptyState
          icon={<Lock className="h-6 w-6" />}
          title="Billing is restricted"
          description="Only the workspace owner can view and manage billing."
          action={<LinkButton href="/dashboard" variant="secondary">Back to dashboard</LinkButton>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Billing" description="Plan, usage and invoices for your workspace." />

      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : loading || !data ? (
        <div className="space-y-6">
          <Skeleton className="h-[220px] rounded-2xl" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[220px] rounded-2xl" />
            <Skeleton className="h-[220px] rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="surface relative overflow-hidden p-5 sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/20 blur-[90px]" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-white">{data.plan.name} plan</h3>
                  <Badge tone="violet">Current plan</Badge>
                </div>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  ${data.plan.priceMonthly}
                  <span className="ml-1 text-sm font-normal text-slate-400">/ month</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {data.plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2 md:items-end">
                <Button disabled title="Payments are not enabled in this MVP">Change plan</Button>
                <p className="max-w-[16rem] text-xs text-slate-500 md:text-right">
                  Payment processing is not enabled in this version of TaskFlow.
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="surface p-5 sm:p-6">
              <h3 className="text-base font-semibold text-white">Usage</h3>
              <p className="mt-1 text-sm text-slate-400">Live counts from your workspace.</p>
              <div className="mt-5 space-y-5">
                <UsageMeter label="Team members" used={data.usage.members} limit={data.plan.limits.members} />
                <UsageMeter label="Projects" used={data.usage.projects} limit={data.plan.limits.projects} />
                <UsageMeter label="Tasks" used={data.usage.tasks} limit={data.plan.limits.tasks} />
              </div>
            </section>

            <section className="surface p-5 sm:p-6">
              <h3 className="text-base font-semibold text-white">Payment method</h3>
              <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
                <CreditCard className="h-8 w-8 text-slate-600" />
                <p className="mt-3 text-sm font-medium text-slate-200">
                  {data.paymentMethod ? `${data.paymentMethod.brand} ending in ${data.paymentMethod.last4}` : "No payment method on file"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">You won&apos;t be charged on the Starter plan.</p>
                <Button variant="secondary" size="sm" className="mt-4" disabled>
                  Add payment method
                </Button>
              </div>
            </section>
          </div>

          <section className="surface p-5 sm:p-6">
            <h3 className="text-base font-semibold text-white">Billing history</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-slate-500">
                    <th className="pb-3 font-medium">Invoice</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-white/[0.04] text-slate-300">
                      <td className="py-3">{inv.id}</td>
                      <td className="py-3">{inv.date}</td>
                      <td className="py-3">${inv.amount}</td>
                      <td className="py-3">{inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.invoices.length === 0 && (
                <div className="flex flex-col items-center py-10 text-center">
                  <Receipt className="h-8 w-8 text-slate-600" />
                  <p className="mt-3 text-sm font-medium text-slate-200">No invoices yet</p>
                  <p className="mt-0.5 text-xs text-slate-500">Invoices will appear here once billing is enabled.</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-base font-semibold text-white">Available plans</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => {
                const current = p.id === data.plan.id;
                return (
                  <div key={p.id} className={cn("surface flex flex-col p-5", current && "border-brand/40")}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">{p.name}</h4>
                      {current && <Badge tone="violet">Current</Badge>}
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {p.price}
                      <span className="ml-1 text-sm font-normal text-slate-500">/ month</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{p.blurb}</p>
                    <ul className="mt-4 flex-1 space-y-2">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                          <Check className="h-4 w-4 text-slate-500" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant="secondary" className="mt-5 w-full" disabled>
                      {current ? "Your plan" : "Coming soon"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </>
  );
}