import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: "#0a0a0f",
          surface: "#111118",
          border: "#1e1e2e",
          muted: "#2a2a3a",
        },
        node: {
          text: "#7c6af7",
          image: "#3b82f6",
          video: "#10b981",
          llm: "#f59e0b",
          crop: "#ec4899",
          extract: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "pulse-glow": "pulseGlow 1.2s ease-in-out infinite",
        "dash-flow": "dashFlow 0.5s linear infinite",
        spin: "spin 0.8s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        dashFlow: {
          to: { strokeDashoffset: "-24" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
