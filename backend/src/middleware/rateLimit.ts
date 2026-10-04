import { rateLimit } from "express-rate-limit";
import { env } from "../config/env";

const isProd = env.NODE_ENV === "production";

// Failed logins only: successful sign-ins don't count against the limit.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 10 : 500,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please wait a few minutes and try again." },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isProd ? 5 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many accounts created from this network. Please try again later." },
});

// General protection for the whole API (production only).
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProd,
  message: { message: "Too many requests. Please slow down and try again shortly." },
});