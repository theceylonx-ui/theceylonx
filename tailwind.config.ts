import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.75rem",
        "2xl": "1rem",
      },
      colors: {
        // HiBowan design system — locked tokens: coral #DB354E, ocean #3F8AB4, navy #173B4D, cream #F8F4EA, white
        brand: {
          DEFAULT: "hsl(351 70% 53%)", // #DB354E - coral-red
          hover: "hsl(351 70% 43%)",   // darker hover
          subtle: "hsl(351 70% 96%)",  // light background tint
        },
        accent: {
          DEFAULT: "hsl(202 48% 48%)", // #3F8AB4 - ocean blue
          hover: "hsl(202 48% 38%)",   // darker ocean
          subtle: "hsl(202 48% 95%)",  // light ocean tint
        },
        text: {
          primary: "hsl(200 54% 20%)", // #173B4D - deep navy
          secondary: "hsl(200 25% 38%)",
          muted: "hsl(200 15% 52%)",
        },
        ui: {
          bg: "hsl(43 50% 95%)",       // #F8F4EA - cream background
          surface: "hsl(0 0% 100%)",   // #FFFFFF - white surface
          line: "hsl(40 25% 85%)",     // warm neutral border
        },
        danger: "hsl(358 76% 51%)",    // #D92D20 - red
        "danger-hover": "hsl(358 76% 40%)", // darker danger
        success: "hsl(158 75% 33%)",   // #099250 - green
        info: "hsl(207 71% 51%)",      // #1E88E5 - blue
        // Legacy Ceylon* aliases kept for backward compatibility, remapped to HiBowan tokens
        "ceylon-green": "hsl(351 70% 53%)",  // now brand/coral
        "ceylon-blue": "hsl(202 48% 48%)",   // now accent/ocean
        "ceylon-dark": "hsl(200 54% 20%)",   // now text-primary/navy
        "ceylon-orange": "hsl(351 65% 60%)", // coral, lighter
        "ceylon-red": "hsl(351 70% 48%)",    // coral, darker
        "ceylon-yellow": "hsl(38 55% 68%)",  // warm gold, cream-adjacent
        "ceylon-brown": "hsl(200 40% 30%)",  // navy-adjacent dark neutral
        "ceylon-cream": "hsl(43 50% 95%)",   // cream
        "ceylon-sand": "hsl(40 35% 88%)",    // warm sand

        // Keep shadcn compatibility
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          '"Segoe UI"', 
          'Roboto', 
          '"Helvetica Neue"', 
          'Arial', 
          '"Noto Sans"', 
          'sans-serif',
          '"Apple Color Emoji"', 
          '"Segoe UI Emoji"'
        ],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'h1': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h2': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'lead': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.75', fontWeight: '400' }],
        'caption': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      minHeight: {
        '11': '2.75rem',
        '12': '3rem',
        '44': '11rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;