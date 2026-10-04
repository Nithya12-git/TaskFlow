import { asyncHandler } from "../utils/asyncHandler";
import { getContext } from "../utils/currentUser";
import * as taskService from "../services/task.service";
import { createTaskSchema, updateTaskSchema, listTasksQuery } from "../validators/task.validators";

export const listTasks = asyncHandler(async (req, res) => {
  const filters = listTasksQuery.parse(req.query);
  res.json(await taskService.listTasks(req.auth!.tenantId, req.auth!.userId, filters));
});

export const getTask = asyncHandler(async (req, res) => {
  res.json(await taskService.getTask(req.auth!.tenantId, req.params.id));
});

export const createTask = asyncHandler(async (req, res) => {
  const data = createTaskSchema.parse(req.body);
  res.status(201).json(await taskService.createTask(await getContext(req), data));
});

export const updateTask = asyncHandler(async (req, res) => {
  const data = updateTaskSchema.parse(req.body);
  res.json(await taskService.updateTask(await getContext(req), req.params.id, data));
});

export const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(await getContext(req), req.params.id);
  res.status(204).send();
});