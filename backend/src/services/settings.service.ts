import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";
import { logActivity } from "./activity.service";

export async function updateProfile(userId: string, input: { name: string; email: string }) {
  const clash = await prisma.user.findFirst({
    where: { email: input.email, NOT: { id: userId } },
  });
  if (clash) throw new AppError(409, "That email is already used by another account.");
  await prisma.user.update({ where: { id: userId }, data: input });
}

export async function updateWorkspace(
  ctx: { tenantId: string; userId: string; userName: string },
  input: { name: string }
) {
  const tenant = await prisma.tenant.update({ where: { id: ctx.tenantId }, data: { name: input.name } });
  await logActivity({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "WORKSPACE_UPDATED",
    entityType: "WORKSPACE",
    entityId: tenant.id,
    message: `${ctx.userName} renamed the workspace to ${tenant.name}`,
  });
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string }
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await bcrypt.compare(input.currentPassword, user.password);
  if (!valid) throw new AppError(400, "Current password is incorrect.");
  if (input.currentPassword === input.newPassword) {
    throw new AppError(400, "Choose a new password that is different from the current one.");
  }
  const password = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password } });
}