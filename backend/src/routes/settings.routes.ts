import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requirePermission } from "../middleware/requirePermission";
import * as c from "../controllers/settings.controller";

const router = Router();

router.use(authenticate);

router.put("/profile", c.updateProfile);
router.put("/password", c.changePassword);
router.put("/workspace", requirePermission("settings:manage"), c.updateWorkspace);

export default router;