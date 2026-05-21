/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#0066FF',
          hover:   '#0052D6',
          light:   '#E5EEFF',
          muted:   '#80AAFF',
        },
        accent: {
          DEFAULT: '#38BDF8',
          hover:   '#0EA5E9',
        },
        dark: {
          DEFAULT:  '#05091A',
          card:     '#0A1128',
          elevated: '#0F1830',
          border:   '#1A2845',
          muted:    '#2A3D5E',
        },
      },
    },
  },
  plugins: [],
}
