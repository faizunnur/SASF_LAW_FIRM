/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Source Sans 3", "ui-sans-serif", "system-ui"],
        display: ["Cormorant Garamond", "Georgia", "serif"]
      },
      boxShadow: {
        glow: "0 24px 80px rgba(15, 23, 42, 0.18)"
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -12px, 0)" }
        },
        drift: {
          "0%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(16px, -20px, 0) scale(1.05)" },
          "100%": { transform: "translate3d(0, 0, 0) scale(1)" }
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translate3d(0, 18px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" }
        }
      },
      animation: {
        floaty: "floaty 8s ease-in-out infinite",
        drift: "drift 12s ease-in-out infinite",
        fadeUp: "fadeUp 0.7s ease-out both"
      }
    }
  },
  plugins: []
};
