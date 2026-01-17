import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'], // Playfair Display
        body: ['var(--font-body)', 'system-ui', 'sans-serif'], // Outfit
        amharic: ['var(--font-amharic)', 'system-ui', 'sans-serif'], // Noto Sans Ethiopic
      },
      colors: {
        // Simien Sunset Palette - Direct color references
        'simien-deep': 'hsl(var(--simien-deep))',
        'simien-sky': 'hsl(var(--simien-sky))',
        'simien-mist': 'hsl(var(--simien-mist))',
        'sun-gold': 'hsl(var(--sun-gold))',
        'earth-terracotta': 'hsl(var(--earth-terracotta))',
        'coffee-bean': 'hsl(var(--coffee-bean))',
        'highland-emerald': 'hsl(var(--highland-emerald))',
        'barley-field': 'hsl(var(--barley-field))',
        'eth-green': 'hsl(var(--eth-green))',
        'eth-yellow': 'hsl(var(--eth-yellow))',
        'eth-red': 'hsl(var(--eth-red))',
        // Custom i-Ticket theme
        primary: {
          DEFAULT: '#018790',
          50: '#E6F7F7',
          100: '#CCF0F0',
          200: '#99E1E0',
          300: '#66D2D1',
          400: '#33C3C1',
          500: '#00B7B5',
          600: '#018790',
          700: '#005461',
          800: '#003D47',
          900: '#00262D',
        },
        secondary: {
          DEFAULT: '#00B7B5',
          50: '#E6FAF9',
          100: '#CCF5F4',
          200: '#99EBE9',
          300: '#66E1DE',
          400: '#33D7D3',
          500: '#00B7B5',
          600: '#009997',
          700: '#007B79',
          800: '#005D5C',
          900: '#003F3E',
        },
        accent: {
          DEFAULT: '#005461',
          50: '#E6EEF0',
          100: '#CCDDE1',
          200: '#99BBC3',
          300: '#6699A5',
          400: '#337787',
          500: '#005461',
          600: '#004350',
          700: '#00323F',
          800: '#00222E',
          900: '#00111D',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'float': 'float 8s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'coffee-ripple': 'coffeeRipple 0.6s ease-out',
        'sun-pulse': 'sunPulse 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 15s ease infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(32px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '25%': { transform: 'translateY(-20px) translateX(10px)' },
          '50%': { transform: 'translateY(-10px) translateX(-10px)' },
          '75%': { transform: 'translateY(-15px) translateX(5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        coffeeRipple: {
          '0%': { boxShadow: '0 0 0 0 rgba(184, 82, 44, 0.4)' },
          '100%': { boxShadow: '0 0 0 24px rgba(184, 82, 44, 0)' },
        },
        sunPulse: {
          '0%, 100%': { filter: 'brightness(1)' },
          '50%': { filter: 'brightness(1.1)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%, 100% 50%' },
          '50%': { backgroundPosition: '100% 50%, 0% 50%' },
        },
      },
      backgroundImage: {
        'ethiopian-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23018790' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, var(--tw-gradient-from) 0%, transparent 50%, var(--tw-gradient-to) 100%)',
      },
    },
  },
  plugins: [],
}
export default config
