import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import * as activityService from "../services/activity.service";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  entityType: z.string().optional(),
});

export const listActivity = asyncHandler(async (req, res) => {
  const opts = querySchema.parse(req.query);
  res.json(await activityService.listActivity(req.auth!.tenantId, opts));
});