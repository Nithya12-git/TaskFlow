import { prisma } from "../config/prisma";

interface ActivityInput {
  tenantId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  message: string;
}

export async function logActivity(input: ActivityInput) {
  await prisma.activity.create({ data: input });
}

export async function listActivity(tenantId: string, opts: { limit?: number; entityType?: string }) {
  return prisma.activity.findMany({
    where: { tenantId, ...(opts.entityType ? { entityType: opts.entityType } : {}) },
    orderBy: { createdAt: "desc" },
    take: Math.min(opts.limit ?? 30, 100),
    include: { user: { select: { id: true, name: true } } },
  });
}