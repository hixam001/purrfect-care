/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream:    { DEFAULT: '#F5EBE6', soft: '#FAF5F2', oat: '#EFE5DC' },
        clay:     { DEFAULT: '#D7C9BD', muted: '#A08C7D' },
        espresso: { DEFAULT: '#3D2616', soft: '#4E342E' },
        olive:    { DEFAULT: '#556B2F', light: '#6B8E23', dark: '#3D4F21' },
        amber:    { DEFAULT: '#C48C38', light: '#F0C46A' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backgroundImage: {
        'mesh': `
          radial-gradient(ellipse 700px 500px at 85% 10%, rgba(107,142,35,.13) 0%, transparent 70%),
          radial-gradient(ellipse 500px 400px at 5%  90%, rgba(196,140,56,.10) 0%, transparent 70%)
        `,
      },
    },
  },
  plugins: [],
}
