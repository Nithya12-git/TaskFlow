import { asyncHandler } from "../utils/asyncHandler";
import { getContext } from "../utils/currentUser";
import * as settingsService from "../services/settings.service";
import * as authService from "../services/auth.service";
import {
  updateProfileSchema,
  updateWorkspaceSchema,
  changePasswordSchema,
} from "../validators/settings.validators";

export const updateProfile = asyncHandler(async (req, res) => {
  const input = updateProfileSchema.parse(req.body);
  await settingsService.updateProfile(req.auth!.userId, input);
  res.json(await authService.getSession(req.auth!.userId));
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const input = updateWorkspaceSchema.parse(req.body);
  await settingsService.updateWorkspace(await getContext(req), input);
  res.json(await authService.getSession(req.auth!.userId));
});

export const changePassword = asyncHandler(async (req, res) => {
  const input = changePasswordSchema.parse(req.body);
  await settingsService.changePassword(req.auth!.userId, input);
  res.json({ message: "Password updated." });
});