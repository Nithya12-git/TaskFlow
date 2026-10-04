import { asyncHandler } from "../utils/asyncHandler";
import { registerSchema, loginSchema } from "../validators/auth.validators";
import * as authService from "../services/auth.service";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/jwt";

export const registerHandler = asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const userId = await authService.register(input);
  setAuthCookie(res, signToken(userId));
  res.status(201).json(await authService.getSession(userId));
});

export const loginHandler = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const userId = await authService.login(input);
  setAuthCookie(res, signToken(userId));
  res.json(await authService.getSession(userId));
});

export const logoutHandler = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Signed out." });
});

export const meHandler = asyncHandler(async (req, res) => {
  res.json(await authService.getSession(req.auth!.userId));
});