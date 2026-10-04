import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/errors";
import { ROLE_PERMISSIONS } from "../utils/permissions";
import { RegisterInput, LoginInput } from "../validators/auth.validators";

// Compared against when the email doesn't exist, so login takes the same time
// either way and can't be used to discover which emails are registered.
const DUMMY_HASH = bcrypt.hashSync("taskflow-dummy-password", 12);

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, "An account with this email already exists.");

  const password = await bcrypt.hash(input.password, 12);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name: input.name, email: input.email, password } });
    const tenant = await tx.tenant.create({ data: { name: input.workspaceName } });
    await tx.membership.create({ data: { userId: user.id, tenantId: tenant.id, role: "OWNER" } });
    await tx.activity.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: "WORKSPACE_CREATED",
        entityType: "WORKSPACE",
        entityId: tenant.id,
        message: `${user.name} created workspace ${tenant.name}`,
      },
    });
    return user.id;
  });
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const valid = await bcrypt.compare(input.password, user ? user.password : DUMMY_HASH);
  if (!user || !valid) throw new AppError(401, "Invalid email or password.");
  return user.id;
}

export async function getSession(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: {
      tenant: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true, createdAt: true } },
    },
  });
  if (!membership) throw new AppError(401, "Account not found. Please sign in again.");

  return {
    user: membership.user,
    workspace: membership.tenant,
    role: membership.role,
    permissions: ROLE_PERMISSIONS[membership.role],
  };
}