/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "#f8fafc",
        ink: "#0f172a",
        card: "#ffffff",
        gold: "#D97706",
        deep: "#0f172a",
        muted: "#64748b",
        line: "#e2e8f0",
        up: "#047857",
        down: "#b91c1c",
      },
    },
  },
  plugins: [],
};
