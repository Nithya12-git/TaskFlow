import { asyncHandler } from "../utils/asyncHandler";
import { getContext } from "../utils/currentUser";
import * as teamService from "../services/team.service";
import { addMemberSchema, updateRoleSchema } from "../validators/team.validators";

export const listMembers = asyncHandler(async (req, res) => {
  res.json(await teamService.listMembers(req.auth!.tenantId));
});

export const addMember = asyncHandler(async (req, res) => {
  const input = addMemberSchema.parse(req.body);
  res.status(201).json(await teamService.addMember(await getContext(req), input));
});

export const changeRole = asyncHandler(async (req, res) => {
  const { role } = updateRoleSchema.parse(req.body);
  res.json(await teamService.changeRole(await getContext(req), req.params.id, role));
});

export const removeMember = asyncHandler(async (req, res) => {
  await teamService.removeMember(await getContext(req), req.params.id);
  res.status(204).send();
});