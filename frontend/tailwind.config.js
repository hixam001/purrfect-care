/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Mint green — light base colour
        mint:       { DEFAULT: '#dbe8d8', soft: '#eef4ec', deep: '#c9dbc6' },
        // Carafe — dark primary / brand colour
        carafe:     { DEFAULT: '#5e4749', light: '#7a5e60', dark: '#4a373a' },
        // Semantic aliases kept for backward-compat with existing class names
        cream:      { DEFAULT: '#dbe8d8', soft: '#eef4ec', oat: '#c9dbc6' },
        clay:       { DEFAULT: '#b8ceb5', muted: '#7a5e60' },
        espresso:   { DEFAULT: '#3a2c2d', soft: '#4a373a' },
        olive:      { DEFAULT: '#5e4749', light: '#7a5e60', dark: '#4a373a' },
        amber:      { DEFAULT: '#B87C2A', light: '#E0A84A' },
        terracotta: { DEFAULT: '#B85C38', light: '#D4714A', muted: '#8C4229' },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backgroundImage: {
        'mesh': `
          radial-gradient(ellipse 700px 500px at 85% 10%, rgba(94,71,73,.09) 0%, transparent 70%),
          radial-gradient(ellipse 500px 400px at 5%  90%, rgba(94,71,73,.06) 0%, transparent 70%)
        `,
      },
      lineHeight: {
        'relaxed': '1.7',
      },
    },
  },
  plugins: [],
}
