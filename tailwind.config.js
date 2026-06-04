/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Chocolate palette — based on actual chocolate, not theoretical "dark mode"
        cocoa: {
          950: '#0d0703',  // burnt black
          900: '#1a0d05',  // dark cocoa
          800: '#2a1810',  // milk chocolate dark
          700: '#3a2418',  // milk chocolate
          600: '#5a3a24',  // mocha
          500: '#8b5a36',  // caramel
        },
        cream: {
          50:  '#fef9ef',
          100: '#fef0d5',
          200: '#f9dfa6',
          300: '#f4d2a3',  // warm cream
          400: '#e8b878',
          500: '#c9a880',  // muted cream
        },
        gold:  '#e89c3b',
        chili: '#c05626',  // burnt sugar
        mint:  '#7fb069',  // FRESH! sticker green
      },
      fontFamily: {
        serif:   ['"Fraunces"', 'Georgia', 'serif'],
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
        modern:  ['"Geist"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        hand:    ['"Caveat"', '"Bradley Hand"', '"Marker Felt"', '"Segoe Print"', 'sans-serif'],
      },
      animation: {
        'marquee':    'marquee 40s linear infinite',
        'wobble':     'wobble 4s ease-in-out infinite',
        'sticker-in': 'stickerIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%':      { transform: 'rotate(2deg)' },
        },
        stickerIn: {
          '0%':   { opacity: '0', transform: 'scale(0.5) rotate(-12deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-4deg)' },
        },
      },
    },
  },
  plugins: [],
}
