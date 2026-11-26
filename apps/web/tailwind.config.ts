import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        obsidian: "#07090E",
        ink: "#F8FAFC",
        mist: "#94A3B8",
        foil: {
          light: "#FDE68A",
          DEFAULT: "#F59E0B",
          deep: "#B45309",
        },
        gain: "#10B981",
        drop: "#F43F5E",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        display: ["var(--font-jakarta)", "Plus Jakarta Sans", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glass: "inset 0 1px 0 0 rgba(255,255,255,0.12), 0 20px 40px -15px rgba(0,0,0,0.7)",
        foil: "0 0 25px rgba(245,158,11,0.22)",
      },
      backgroundImage: {
        foil: "linear-gradient(to right, #FDE68A, #F59E0B, #B45309)",
        "hero-glow": "radial-gradient(circle at 50% 0%, rgba(217, 119, 6, 0.14), transparent 60%)",
        metal: "linear-gradient(to bottom, #ffffff, #ffffff, #94a3b8)",
      },
    },
  },
};

export default config;
