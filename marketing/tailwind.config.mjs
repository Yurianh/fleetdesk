/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Onest', 'system-ui', 'sans-serif'],
        // Display/heading companion — contrast serif for large titles
        display: ['Fraunces', 'Georgia', 'serif'],
        // No monospace: "mono" maps to the sans with tabular figures (see global.css)
        mono: ['Onest', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0066FF',
          hover:   '#0052D6',
          light:   '#E5EEFF',
          muted:   '#80AAFF',
        },
      },
    },
  },
  plugins: [],
}
