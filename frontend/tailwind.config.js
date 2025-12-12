/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "#0f766e",
          soft: "#e9f3f1",
        },
      },
    },
  },
  plugins: [],
};
