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
        // New Ceylon Expand design system
        brand: {
          DEFAULT: "hsl(163 65% 31%)", // #0F8B6E - primary emerald/teal
          hover: "hsl(163 65% 25%)",   // #0C6F59 - darker hover state
          subtle: "hsl(163 65% 95%)",  // #E7F6F2 - light background
        },
        text: {
          primary: "hsl(0 0% 4%)",     // #0B0B0B - near-black
          secondary: "hsl(0 0% 29%)",  // #4A4A4A - muted text
          muted: "hsl(0 0% 44%)",      // #6F6F6F - very muted
        },
        ui: {
          bg: "hsl(0 0% 100%)",        // #FFFFFF - white background
          surface: "hsl(0 0% 97%)",    // #F7F7F7 - light surface
          line: "hsl(0 0% 90%)",       // #E6E6E6 - borders/dividers
        },
        danger: "hsl(358 76% 51%)",    // #D92D20 - red
        "danger-hover": "hsl(358 76% 40%)", // darker danger
        success: "hsl(158 75% 33%)",   // #099250 - green
        info: "hsl(207 71% 51%)",      // #1E88E5 - blue
        // Legacy Ceylon colors for backward compatibility
        "ceylon-green": "hsl(163 65% 31%)", // brand
        "ceylon-blue": "hsl(207 71% 51%)",  // info
        "ceylon-dark": "hsl(0 0% 4%)",      // text-primary
        
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