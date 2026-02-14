import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        terracotta: {
          DEFAULT: "#E07A5F",
          hover: "#c96a52",
        },
        coffee: {
          50: "#fdf8f3",
          100: "#f9ede0",
          200: "#f2d9bc",
          300: "#e8bf8f",
          400: "#dda066",
          500: "#d48444",
          600: "#c66a39",
          700: "#a55231",
          800: "#84422e",
          900: "#6b3828",
          950: "#391b14",
        },
        amber: {
          accent: "#d48444",
          muted: "#a55231",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        hebrew: ["var(--font-hebrew)", "Heebo", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
