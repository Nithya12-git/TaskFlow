"use client";

import { Check, ChevronDown } from "lucide-react";
import { ROLE_LABEL } from "@/lib/utils";
import { RoleBadge } from "@/components/ui/Badges";
import { Popover } from "@/components/ui/Popover";
import type { Role } from "@/types";
import { ROLE_DESCRIPTION } from "./roleInfo";

export function RoleMenu({
  role,
  options,
  onChange,
}: {
  role: Role;
  options: Role[];
  onChange: (role: Role) => void;
}) {
  return (
    <Popover
      align="left"
      panelClassName="w-72 max-w-[calc(100vw-2rem)] p-1.5"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          aria-label="Change role"
          className="group inline-flex items-center gap-1 rounded-full transition hover:opacity-90"
        >
          <RoleBadge role={role} />
          <ChevronDown className="h-3.5 w-3.5 text-slate-500 transition group-hover:text-slate-300" />
        </button>
      )}
    >
      {(close) => (
        <>
          {options.map((r) => (
            <button
              key={r}
              onClick={() => {
                close();
                if (r !== role) onChange(r);
              }}
              className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/[0.06]"
            >
              <span>
                <span className="block text-sm font-medium text-slate-100">{ROLE_LABEL[r]}</span>
                <span className="mt-0.5 block text-xs leading-snug text-slate-500">{ROLE_DESCRIPTION[r]}</span>
              </span>
              {r === role && <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-light" />}
            </button>
          ))}
        </>
      )}
    </Popover>
  );
}