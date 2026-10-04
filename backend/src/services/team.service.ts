import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";
import { logActivity } from "./activity.service";

type Ctx = { tenantId: string; userId: string; userName: string; role: Role };
type AssignableRole = "ADMIN" | "MEMBER" | "GUEST";

const userSelect = { select: { id: true, name: true, email: true } } as const;

function present(m: {
  id: string;
  userId: string;
  role: Role;
  createdAt: Date;
  user: { name: string; email: string };
}, openTasks = 0) {
  return {
    id: m.id,
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    joinedAt: m.createdAt,
    openTasks,
  };
}

async function findMember(tenantId: string, id: string) {
  const member = await prisma.membership.findFirst({
    where: { id, tenantId },
    include: { user: userSelect },
  });
  if (!member) throw new AppError(404, "Team member not found.");
  return member;
}

export async function listMembers(tenantId: string) {
  const members = await prisma.membership.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
    include: { user: userSelect },
  });
  const counts = await prisma.task.groupBy({
    by: ["assignedTo"],
    where: { tenantId, assignedTo: { not: null }, status: { not: "COMPLETED" } },
    _count: { _all: true },
  });
  const open = new Map<string | null, number>(counts.map((c) => [c.assignedTo, c._count._all] as [string | null, number]));
  return members.map((m) => present(m, open.get(m.userId) ?? 0));
}

export async function addMember(
  ctx: Ctx,
  input: { name: string; email: string; password: string; role: AssignableRole }
) {
  if (input.role === "ADMIN" && ctx.role !== "OWNER") {
    throw new AppError(403, "Only the owner can add admins.");
  }
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, "An account with this email already exists.");

  const password = await bcrypt.hash(input.password, 12);
  const member = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name: input.name, email: input.email, password } });
    return tx.membership.create({
      data: { userId: user.id, tenantId: ctx.tenantId, role: input.role },
      include: { user: userSelect },
    });
  });

  await logActivity({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "MEMBER_ADDED",
    entityType: "USER",
    entityId: member.userId,
    message: `${ctx.userName} added ${input.name} as ${input.role}`,
  });
  return present(member);
}

export async function changeRole(ctx: Ctx, id: string, role: AssignableRole) {
  const target = await findMember(ctx.tenantId, id);
  if (target.role === "OWNER") throw new AppError(403, "The workspace owner's role can't be changed.");
  if (target.userId === ctx.userId) throw new AppError(400, "You can't change your own role.");
  if (ctx.role !== "OWNER" && (target.role === "ADMIN" || role === "ADMIN")) {
    throw new AppError(403, "Only the owner can manage admins.");
  }

  const updated = await prisma.membership.update({
    where: { id },
    data: { role },
    include: { user: userSelect },
  });
  await logActivity({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "MEMBER_ROLE_CHANGED",
    entityType: "USER",
    entityId: target.userId,
    message: `${ctx.userName} changed ${target.user.name}'s role from ${target.role} to ${role}`,
  });
  return present(updated);
}

export async function removeMember(ctx: Ctx, id: string) {
  const target = await findMember(ctx.tenantId, id);
  if (target.role === "OWNER") throw new AppError(403, "The workspace owner can't be removed.");
  if (target.userId === ctx.userId) throw new AppError(400, "You can't remove yourself.");
  if (ctx.role !== "OWNER" && target.role === "ADMIN") {
    throw new AppError(403, "Only the owner can remove admins.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.updateMany({
      where: { tenantId: ctx.tenantId, assignedTo: target.userId },
      data: { assignedTo: null },
    });
    await tx.membership.delete({ where: { id } });
    const remaining = await tx.membership.count({ where: { userId: target.userId } });
    if (remaining === 0) await tx.user.delete({ where: { id: target.userId } });
  });

  await logActivity({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "MEMBER_REMOVED",
    entityType: "USER",
    entityId: target.userId,
    message: `${ctx.userName} removed ${target.user.name} from the workspace`,
  });
}