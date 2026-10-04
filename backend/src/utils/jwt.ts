import jwt from "jsonwebtoken";
import { CookieOptions, Response } from "express";
import { env } from "../config/env";

export const COOKIE_NAME = "taskflow_token";

export function signToken(userId: string) {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as { userId: string };
}

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const setAuthCookie = (res: Response, token: string) => res.cookie(COOKIE_NAME, token, cookieOptions);

export const clearAuthCookie = (res: Response) =>
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });