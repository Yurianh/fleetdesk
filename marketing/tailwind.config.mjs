/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Onest', 'system-ui', 'sans-serif'],
        // Titres : même police que le texte (direction « Planche », Onest seul).
        display: ['Onest', 'system-ui', 'sans-serif'],
        // No monospace: "mono" maps to the sans with tabular figures (see global.css)
        mono: ['Onest', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0052D6',
          hover:   '#003A99',
          light:   '#E5EEFF',
          muted:   '#80AAFF',
        },
        // Direction « Planche » (gravure) : encre bleue sur papier, filets fins.
        plate: {
          ink:   '#0052D6',
          paper: '#F7F9FF',
          text:  '#0B1B3F',
          body:  '#34446A',
          muted: '#4A5A80',
          rule:  '#B9C7E4',
          tint:  '#EAF0FC',
        },
      },
    },
  },
  plugins: [],
}
