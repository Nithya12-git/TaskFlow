export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// NEXT_PUBLIC_API_URL:
//   unset        -> http://localhost:4000 (local development)
//   "same-origin" -> /api on the current domain (production, behind the Next.js rewrite)
//   any URL      -> that URL
const configured = process.env.NEXT_PUBLIC_API_URL;
const BASE = !configured ? "http://localhost:4000" : configured === "same-origin" ? "" : configured;

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server. Please check your connection and try again.");
  }

  // A 401 on any data request means the session ended. Auth endpoints handle their own 401s.
  if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/")) {
    window.dispatchEvent(new Event("taskflow:unauthorized"));
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.message ?? "Something went wrong. Please try again.",
      data?.errors
    );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: (path: string) => request<void>("DELETE", path),
};

export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again.") {
  return err instanceof ApiError ? err.message : fallback;
}