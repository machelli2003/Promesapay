/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sky: {
          25:  "#f0f9ff",
          50:  "#e0f2fe",
          100: "#bae6fd",
          200: "#7dd3fc",
          300: "#38bdf8",
          400: "#0ea5e9",
          500: "#0284c7",
          600: "#0369a1",
          700: "#075985",
          800: "#0c4a6e",
          900: "#082f49",
        },
        gray: {
          0:   "#ffffff",
          25:  "#fcfcfd",
          50:  "#f9fafb",
          100: "#f2f4f7",
          200: "#e4e7ec",
          300: "#d0d5dd",
          400: "#98a2b3",
          500: "#667085",
          600: "#475467",
          700: "#344054",
          800: "#1d2939",
          900: "#101828",
          950: "#0c111d",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "18":  "4.5rem",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem",   letterSpacing: "0.02em" }],
        "xs":  ["0.75rem",  { lineHeight: "1.125rem" }],
        "sm":  ["0.875rem", { lineHeight: "1.25rem" }],
        "md":  ["1rem",     { lineHeight: "1.5rem" }],
        "lg":  ["1.125rem", { lineHeight: "1.75rem" }],
        "xl":  ["1.25rem",  { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem",   { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.375rem" }],
        "4xl": ["2.25rem",  { lineHeight: "2.75rem" }],
      },
      boxShadow: {
        "xs":     "0px 1px 2px rgba(16, 24, 40, 0.05)",
        "sm":     "0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)",
        "md":     "0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)",
        "lg":     "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
        "xl":     "0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)",
        "focus":  "0px 0px 0px 4px rgba(14, 165, 233, 0.15)",
        "focus-error": "0px 0px 0px 4px rgba(240, 68, 56, 0.15)",
      },
      borderRadius: {
        "none": "0",
        "sm":   "0.375rem",   // 6px
        "md":   "0.5rem",     // 8px
        "lg":   "0.75rem",    // 12px
        "xl":   "1rem",       // 16px
        "2xl":  "1.25rem",    // 20px
        "full": "9999px",
      },
      animation: {
        "fade-in":    "fadeIn 0.25s ease-out both",
        "slide-up":   "slideUp 0.3s cubic-bezier(0.16,1,0.3,1) both",
        "slide-down": "slideDown 0.3s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in":   "scaleIn 0.2s ease-out both",
        "shimmer":    "shimmer 1.8s ease-in-out infinite",
        "spin-slow":  "spin 2s linear infinite",
      },
      keyframes: {
        fadeIn:    { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp:   { "0%": { opacity: 0, transform: "translateY(10px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        slideDown: { "0%": { opacity: 0, transform: "translateY(-10px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        scaleIn:   { "0%": { opacity: 0, transform: "scale(0.96)" }, "100%": { opacity: 1, transform: "scale(1)" } },
        shimmer:   { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
      },
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
      },
    },
  },
  plugins: [],
};