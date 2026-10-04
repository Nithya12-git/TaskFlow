"use client";

import { Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, RoleBadge } from "@/components/ui/Badges";
import type { Member, Role } from "@/types";
import { RoleMenu } from "./RoleMenu";

export function MemberRow({
  member,
  isYou,
  manageable,
  roleOptions,
  onChangeRole,
  onRemove,
}: {
  member: Member;
  isYou: boolean;
  manageable: boolean;
  roleOptions: Role[];
  onChangeRole: (member: Member, role: Role) => void;
  onRemove: (member: Member) => void;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:bg-white/[0.04] sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={member.name} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-medium text-slate-100">
            <span className="truncate">{member.name}</span>
            {isYou && <Badge tone="violet">You</Badge>}
          </p>
          <p className="truncate text-xs text-slate-500">{member.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pl-12 sm:pl-0">
        <span className="text-xs text-slate-500">
          <span className="font-medium text-slate-300">{member.openTasks}</span> open{" "}
          {member.openTasks === 1 ? "task" : "tasks"}
        </span>
        <span className="hidden text-xs text-slate-500 md:inline">Joined {formatDate(member.joinedAt)}</span>

        <div className="sm:w-28">
          {manageable ? (
            <RoleMenu role={member.role} options={roleOptions} onChange={(r) => onChangeRole(member, r)} />
          ) : (
            <RoleBadge role={member.role} />
          )}
        </div>

        <div className="w-8">
          {manageable && (
            <button
              onClick={() => onRemove(member)}
              aria-label={`Remove ${member.name}`}
              title="Remove from workspace"
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}