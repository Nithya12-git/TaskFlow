import { RequestHandler } from "express";
import { Permission, can } from "../utils/permissions";
import { AppError } from "../utils/errors";

export const requirePermission =
  (permission: Permission): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(new AppError(401, "Please sign in to continue."));
    if (!can(req.auth.role, permission)) {
      return next(new AppError(403, "You don't have permission to do that."));
    }
    next();
  };