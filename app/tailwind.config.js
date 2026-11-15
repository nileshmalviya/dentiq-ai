/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dentiq: {
          primary: "#0D9488",
          hover: "#0F766E",
          secondary: "#14B8A6",
          navy: "#0F172A",
          page: "#F1F5F9",
          tint: "#CCFBF1",
          border: "#E2E8F0",
          muted: "#64748B"
        }
      }
    }
  },
  plugins: []
};
