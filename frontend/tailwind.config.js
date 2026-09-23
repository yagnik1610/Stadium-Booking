/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        stadium: {
          brand: '#2563EB',      // Primary Royal Blue
          secondary: '#3B82F6',  // Secondary Blue
          sky: '#60A5FA',        // Sky Blue
          ice: '#F0F7FF',        // Ice Blue
          soft: '#EFF6FF',       // Very Light Blue
          navy: '#172554',       // Dark Navy (headings, selective high-contrast)
          dark: '#172554',       // Dark Navy alias
          slate: '#334155',      // Body Slate
          muted: '#64748B',      // Muted Slate
          border: '#E2E8F0',     // Neutral Border
          lightBorder: '#DBEAFE',// Light Blue Border
          light: '#F8FAFC',      // White/Ice background
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
