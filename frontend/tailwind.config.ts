import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./stores/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#c3b07d",
          light: "#d6c295",
          dark: "#b59b5d",
          bg: "#fcfaf6",
          hover: "#e2d0ac",
          50: "#fcfaf6",
          100: "#f5f0e3",
          200: "#e8dcc2",
          300: "#d6c295",
          400: "#c3b07d",
          500: "#b59b5d",
          600: "#a08746",
          700: "#86703a",
          800: "#6b5a2f",
          900: "#504324",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
