/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8B5CF6",
          dark: "#7C3AED",
          light: "#A78BFA",
          50: "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          400: "#C084FC",
          500: "#A855F7",
          600: "#9333EA",
          700: "#7E22CE",
          800: "#6B21A8",
          900: "#581C87",
        },
        secondary: {
          DEFAULT: "#EC4899",
          dark: "#DB2777",
          light: "#F472B6",
        },
        accent: {
          cyan: "#06B6D4",
          blue: "#3B82F6",
          purple: "#8B5CF6",
          pink: "#EC4899",
        },
        dark: {
          DEFAULT: "#0F172A",
          light: "#1E293B",
          lighter: "#334155",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "gradient-secondary":
          "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "gradient-purple": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "gradient-pink": "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
        "gradient-blue": "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
        "gradient-dark": "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(139, 92, 246, 0.5)",
        "glow-lg": "0 0 40px rgba(139, 92, 246, 0.6)",
        card: "0 4px 20px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 8px 30px rgba(139, 92, 246, 0.3)",
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        gradient: "gradient 8s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};
