/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0a0a0f",
          800: "#111827",
          700: "#1f2937",
          600: "#374151",
          500: "#4b5563",
        },
        accent: {
          green: "#22c55e",
          blue: "#3b82f6",
          purple: "#8b5cf6",
        },
      },
    },
  },
  plugins: [],
};
