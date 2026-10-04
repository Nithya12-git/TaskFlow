import { asyncHandler } from "../utils/asyncHandler";
import { getContext } from "../utils/currentUser";
import * as projectService from "../services/project.service";
import { createProjectSchema, updateProjectSchema, listProjectsQuery } from "../validators/project.validators";

export const listProjects = asyncHandler(async (req, res) => {
  const filters = listProjectsQuery.parse(req.query);
  res.json(await projectService.listProjects(req.auth!.tenantId, filters));
});

export const getProject = asyncHandler(async (req, res) => {
  res.json(await projectService.getProject(req.auth!.tenantId, req.params.id));
});

export const createProject = asyncHandler(async (req, res) => {
  const data = createProjectSchema.parse(req.body);
  res.status(201).json(await projectService.createProject(await getContext(req), data));
});

export const updateProject = asyncHandler(async (req, res) => {
  const data = updateProjectSchema.parse(req.body);
  res.json(await projectService.updateProject(await getContext(req), req.params.id, data));
});

export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(await getContext(req), req.params.id);
  res.status(204).send();
});