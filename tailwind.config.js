import plugin from 'tailwindcss/plugin.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: /(text|bg|border)-(age|rarity)-.+/,
    }
  ],
  theme: {
    extend: {
      colors: {
        // All semantic colors resolve through CSS variables (see the theme blocks in
        // src/index.css) so the runtime theme switcher can restyle the whole app.
        bg: {
          primary: 'rgb(var(--th-bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--th-bg-secondary) / <alpha-value>)',
          card: 'rgb(var(--th-bg-card) / <alpha-value>)',
          'card-hover': 'rgb(var(--th-bg-card-hover) / <alpha-value>)',
          input: 'rgb(var(--th-bg-input) / <alpha-value>)',
        },
        accent: {
          primary: 'rgb(var(--th-accent-primary) / <alpha-value>)',
          secondary: 'rgb(var(--th-accent-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--th-accent-tertiary) / <alpha-value>)',
          glow: 'var(--th-accent-glow)',
        },
        text: {
          primary: 'rgb(var(--th-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--th-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--th-text-muted) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--th-border) / <alpha-value>)',
          hover: 'rgb(var(--th-border-hover) / <alpha-value>)',
        },
        rarity: {
          common: 'var(--age-primitive)',
          rare: 'var(--age-medieval)',
          epic: 'var(--age-early-modern)',
          legendary: 'var(--age-modern)',
          ultimate: 'var(--age-space)',
          mythic: 'var(--age-interstellar)',
        },
        age: {
          primitive: 'var(--age-primitive)',
          medieval: 'var(--age-medieval)',
          earlymodern: 'var(--age-early-modern)',
          modern: 'var(--age-modern)',
          space: 'var(--age-space)',
          interstellar: 'var(--age-interstellar)',
          multiverse: 'var(--age-multiverse)',
          quantum: 'var(--age-quantum)',
          underworld: 'var(--age-underworld)',
          divine: 'var(--age-divine)',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'hammer-swing': 'hammerSwing 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float': 'particleFloat 20s infinite ease-in-out',
      },
      keyframes: {
        hammerSwing: {
          '0%, 100%': { transform: 'rotate(-8deg)' },
          '50%': { transform: 'rotate(8deg)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        particleFloat: {
          '0%, 100%': { transform: 'translateY(100vh) scale(0)', opacity: '0' },
          '10%': { opacity: '0.3' },
          '50%': { transform: 'translateY(50vh) scale(1)', opacity: '0.4' },
          '90%': { opacity: '0.2' },
        }
      }
    },
  },
  plugins: [
    // Tailwind 3.4 ships no pointer variant, so `pointer-coarse:` silently compiled to nothing.
    // Cards that get denser still have to be pressable with a thumb, which needs the real query.
    plugin(({ addVariant }) => {
      addVariant('pointer-coarse', '@media (pointer: coarse)');
      addVariant('pointer-fine', '@media (pointer: fine)');
    }),
  ],
}
