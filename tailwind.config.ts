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
      colors: {
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
    },
  },
  plugins: [],
}
export default config
