import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          30: "#1A3F9E",
          40: "#3959B8",
          50: "#5874D8",
          60: "#7795F8",
          80: "#B7C9FF",
          95: "#EBF0FF"
        },
        secondary: {
          20: "#003828",
          40: "#006D50",
          60: "#46A683",
          80: "#86D7BC",
          95: "#C4FFE8"
        },
        tertiary: {
          30: "#4C1DBF",
          70: "#B39DDB",
          90: "#EDE7F6",
          95: "#F5F1FD"
        },
        neutral: {
          10: "#2D3436",
          95: "#F5F5F7"
        },
        ink: {
          base: "#1A2340"
        }
      },
      borderRadius: {
        xl2: "24px"
      },
      fontFamily: {
        sans: ["var(--font-lexend)"]
      },
      boxShadow: {
        soft: "0 20px 60px rgba(57, 89, 184, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
