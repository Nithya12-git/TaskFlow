import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#070b14",
          900: "#0a1020",
          800: "#0d1425",
          700: "#121a2f",
          600: "#18223b",
        },
        brand: { DEFAULT: "#7c5cff", light: "#a78bfa", blue: "#3b82f6" },
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,.35), 0 8px 30px -8px rgba(124,92,255,.5)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        pop: {
          from: { opacity: "0", transform: "scale(.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in .35s ease-out both",
        shimmer: "shimmer 1.6s infinite",
        "slide-in": "slide-in .25s ease-out both",
        pop: "pop .18s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;