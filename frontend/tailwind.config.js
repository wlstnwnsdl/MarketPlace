/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f4f4f5',
        card: '#ffffff',
        border: '#e4e4e7',
        'text-primary': '#18181b',
        'text-secondary': '#71717a',
        'text-muted': '#a1a1aa',
        'badge-free': '#f0fdf4',
        'badge-free-text': '#15803d',
        cta: '#18181b',
        'cta-text': '#ffffff',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
