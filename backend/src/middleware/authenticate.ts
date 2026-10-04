import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import { COOKIE_NAME, verifyToken } from "../utils/jwt";
import { prisma } from "../config/prisma";

// Verifies the cookie AND resolves the user's workspace + role in one step.
// Every later query uses req.auth.tenantId, so tenant isolation starts here.
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new AppError(401, "Please sign in to continue.");

  let userId: string;
  try {
    userId = verifyToken(token).userId;
  } catch {
    throw new AppError(401, "Your session has expired. Please sign in again.");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) throw new AppError(401, "Account not found. Please sign in again.");

  req.auth = { userId, tenantId: membership.tenantId, role: membership.role };
  next();
});