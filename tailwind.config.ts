import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Rose Gold palette
        rosegold: {
          50: "#fdf4f5",
          100: "#fbe8ea",
          200: "#f5c9cd",
          300: "#eda3a9",
          400: "#e08088",
          500: "#c9858e",
          600: "#b76e79",
          700: "#9a5560",
          800: "#7d4450",
          900: "#5c3039",
        },
        // Gold accent
        gold: {
          300: "#e8d5a3",
          400: "#d4af37",
          500: "#c9a84c",
          600: "#b8942a",
        },
        // Dark backgrounds
        dark: {
          50: "#2a2a2a",
          100: "#1f1f1f",
          200: "#1a1a1a",
          300: "#141414",
          400: "#111111",
          500: "#0d0d0d",
          600: "#0a0a0a",
        },
        // Luxury neutral
        luxury: {
          cream: "#f5f0ee",
          silver: "#c0b8b5",
          muted: "#8a8280",
        },
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
      backgroundImage: {
        "rosegold-gradient": "linear-gradient(135deg, #b76e79 0%, #d4af37 100%)",
        "dark-gradient": "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
        "card-gradient": "linear-gradient(145deg, #1f1f1f 0%, #141414 100%)",
      },
      boxShadow: {
        "luxury": "0 4px 24px rgba(183, 110, 121, 0.15)",
        "luxury-lg": "0 8px 40px rgba(183, 110, 121, 0.2)",
        "gold": "0 4px 24px rgba(212, 175, 55, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "shimmer": "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
