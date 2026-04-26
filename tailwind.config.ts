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
          0: "#000000",
          10: "#00164E",
          20: "#00287C",
          30: "#1A3F9E",
          40: "#3858B7",
          50: "#5372D2",
          60: "#6E8CEE",
          70: "#8EA7FF",
          80: "#B5C4FF",
          90: "#DCE1FF",
          95: "#EFF0FF",
          100: "#FFFFFF",
          base: "#7795F8"
        },
        secondary: {
          0: "#000000",
          10: "#002118",
          20: "#00382B",
          30: "#00513F",
          40: "#0B6B55",
          50: "#31856D",
          60: "#4E9F86",
          70: "#6ABAA0",
          80: "#85D6BB",
          90: "#85D6BB",
          95: "#BAFFE6",
          100: "#FFFFFF",
          base: "#86D7BC"
        },
        tertiary: {
          0: "#000000",
          10: "#230F45",
          20: "#38265B",
          30: "#503D73",
          40: "#68548D",
          50: "#816DA7",
          60: "#9C86C3",
          70: "#B7A1DF",
          80: "#D3BCFC",
          90: "#EBDCFF",
          95: "#F7EDFF",
          100: "#FFFFFF",
          base: "#B39DDB"
        },
        neutral: {
          0: "#000000",
          10: "#1A1C1D",
          20: "#2F3132",
          30: "#454749",
          40: "#5D5E60",
          50: "#767779",
          60: "#909193",
          70: "#AAABAD",
          80: "#C6C6C8",
          90: "#E2E2E4",
          95: "#F0F0F2",
          100: "#FFFFFF",
          base: "#F5F5F7"
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
      },
      keyframes: {
        "bm-pulse": {
          "0%, 100%": { opacity: "0.4", transform: "scale(0.85)" },
          "50%": { opacity: "1", transform: "scale(1.15)" }
        },
        "bm-spin-slow": {
          to: { transform: "rotate(360deg)" }
        },
        "bm-float": {
          "0%, 100%": { transform: "translate(0,0) rotate(0deg)" },
          "25%": { transform: "translate(8px,-14px) rotate(8deg)" },
          "50%": { transform: "translate(-6px,10px) rotate(-6deg)" },
          "75%": { transform: "translate(10px,6px) rotate(4deg)" }
        },
        "bm-blink": {
          "50%": { opacity: "0" }
        },
        "bm-slide-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "bm-pulse": "bm-pulse 1.6s ease-in-out infinite",
        "bm-spin-slow": "bm-spin-slow 18s linear infinite",
        "bm-float": "bm-float 18s ease-in-out infinite",
        "bm-blink": "bm-blink 1s step-end infinite",
        "bm-slide-in": "bm-slide-in 0.5s ease both"
      }
    }
  },
  plugins: []
};

export default config;
