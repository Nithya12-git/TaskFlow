import { Router } from "express";
import { registerHandler, loginHandler, logoutHandler, meHandler } from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { loginLimiter, registerLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/register", registerLimiter, registerHandler);
router.post("/login", loginLimiter, loginHandler);
router.post("/logout", logoutHandler);
router.get("/me", authenticate, meHandler);

export default router;