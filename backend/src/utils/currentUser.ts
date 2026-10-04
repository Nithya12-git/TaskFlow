import { Request } from "express";
import { prisma } from "../config/prisma";

export async function getContext(req: Request) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.auth!.userId },
    select: { name: true },
  });
  return {
    tenantId: req.auth!.tenantId,
    userId: req.auth!.userId,
    userName: user.name,
    role: req.auth!.role,
  };
}