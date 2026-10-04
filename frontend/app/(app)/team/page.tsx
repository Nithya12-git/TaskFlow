"use client";

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { api, errorMessage } from "@/lib/api";
import { cn, ROLE_LABEL } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { AddMemberModal } from "@/components/team/AddMemberModal";
import { MemberRow } from "@/components/team/MemberRow";
import { ROLE_DESCRIPTION, ROLE_ORDER } from "@/components/team/roleInfo";
import type { Member, Role } from "@/types";

const roleTone: Record<Role, string> = {
  OWNER: "text-violet-300",
  ADMIN: "text-blue-300",
  MEMBER: "text-emerald-300",
  GUEST: "text-slate-300",
};

export default function TeamPage() {
  const { session, can } = useAuth();
  const toast = useToast();
  const { data, setData, error, loading, retry, reload } = useApi<Member[]>("/team");

  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  if (!session) return null;

  const canManage = can("team:manage");
  const myRole = session.role;
  const myId = session.user.id;
  const roleOptions: Role[] = myRole === "OWNER" ? ["ADMIN", "MEMBER", "GUEST"] : ["MEMBER", "GUEST"];

  // Mirrors the backend rules (the server enforces them too).
  function manageable(member: Member) {
    if (!canManage) return false;
    if (member.role === "OWNER") return false;
    if (member.userId === myId) return false;
    if (myRole !== "OWNER" && member.role === "ADMIN") return false;
    return true;
  }

  async function changeRole(member: Member, role: Role) {
    setData((prev) => (prev ? prev.map((m) => (m.id === member.id ? { ...m, role } : m)) : prev));
    try {
      await api.put(`/team/${member.id}`, { role });
      toast.success(`${member.name} is now ${ROLE_LABEL[role]}.`);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to change the role. Please check your connection and try again."));
    } finally {
      reload();
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      await api.delete(`/team/${removing.id}`);
      toast.success(`${removing.name} was removed from the workspace.`);
      setRemoving(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err, "Unable to remove the member. Please check your connection and try again."));
    } finally {
      setRemoveBusy(false);
    }
  }

  const members = data ?? [];

  return (
    <>
      <PageHeader
        title="Team"
        description={data ? `${members.length} ${members.length === 1 ? "member" : "members"} in ${session.workspace.name}` : "Manage members and their roles."}
        actions={
          canManage && (
            <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
              Add member
            </Button>
          )
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : loading && !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] rounded-2xl" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] rounded-xl" />
            ))}
          </div>
        </div>
      ) : members.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No members yet" description="Add your first teammate to start collaborating." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {ROLE_ORDER.map((role) => (
              <div key={role} className="surface p-4">
                <p className={cn("text-2xl font-semibold", roleTone[role])}>{members.filter((m) => m.role === role).length}</p>
                <p className="mt-0.5 text-sm text-slate-400">{ROLE_LABEL[role]}s</p>
              </div>
            ))}
          </div>

          <ul className={cn("space-y-2", loading && "opacity-60 transition-opacity")}>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isYou={member.userId === myId}
                manageable={manageable(member)}
                roleOptions={roleOptions}
                onChangeRole={changeRole}
                onRemove={setRemoving}
              />
            ))}
          </ul>

          <section className="surface p-5 sm:p-6">
            <h3 className="text-base font-semibold text-white">Roles and permissions</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {ROLE_ORDER.map((role) => (
                <div key={role} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className={cn("text-sm font-semibold", roleTone[role])}>{ROLE_LABEL[role]}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{ROLE_DESCRIPTION[role]}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <AddMemberModal open={addOpen} canAddAdmin={myRole === "OWNER"} onClose={() => setAddOpen(false)} onSaved={reload} />

      <ConfirmDialog
        open={!!removing}
        title="Remove member?"
        message={
          removing
            ? `${removing.name} will lose access to this workspace${removing.openTasks > 0 ? `, and their ${removing.openTasks} open ${removing.openTasks === 1 ? "task" : "tasks"} will become unassigned` : ""}. This can\u2019t be undone.`
            : ""
        }
        confirmLabel="Remove member"
        loading={removeBusy}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}