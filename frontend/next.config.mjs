/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL;

const nextConfig = {
  // In production the browser talks only to the Next.js server, which forwards /api/*
  // to the backend. That keeps the login cookie first-party (no cross-site cookie issues).
  async rewrites() {
    if (!API_URL) return [];
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;