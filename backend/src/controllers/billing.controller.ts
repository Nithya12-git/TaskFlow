import { asyncHandler } from "../utils/asyncHandler";
import * as billingService from "../services/billing.service";

export const getBilling = asyncHandler(async (req, res) => {
  res.json(await billingService.getBilling(req.auth!.tenantId));
});