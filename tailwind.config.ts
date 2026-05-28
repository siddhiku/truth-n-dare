import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          0: "#000000",
          1: "#0A0A0A",
          2: "#111111",
          3: "#161616",
        },
        bone: {
          DEFAULT: "#FFFFFF",
          dim: "#A1A1AA",
          mute: "#71717A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        hero: ["clamp(3rem, 9vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
        heading: ["clamp(2rem, 4.5vw, 2.75rem)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        glow: "0 0 40px rgba(255,255,255,0.12)",
        glowSoft: "0 0 80px rgba(255,255,255,0.06)",
        ring: "0 0 0 1px rgba(255,255,255,0.08)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
        grain: "grain 8s steps(6) infinite",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        grain: {
          "0%,100%": { transform: "translate(0,0)" },
          "20%": { transform: "translate(-2%,3%)" },
          "40%": { transform: "translate(3%,-2%)" },
          "60%": { transform: "translate(-1%,2%)" },
          "80%": { transform: "translate(2%,-1%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
