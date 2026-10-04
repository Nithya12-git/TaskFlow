import { asyncHandler } from "../utils/asyncHandler";
import * as dashboardService from "../services/dashboard.service";

export const getStats = asyncHandler(async (req, res) => {
  res.json(await dashboardService.getStats(req.auth!.tenantId, req.auth!.userId));
});