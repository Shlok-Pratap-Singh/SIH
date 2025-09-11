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
      },
      colors: {
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
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Safety zone colors
        zone: {
          safe: {
            DEFAULT: "hsl(142, 76%, 36%)",
            light: "hsl(142, 76%, 90%)",
            dark: "hsl(142, 76%, 20%)",
          },
          moderate: {
            DEFAULT: "hsl(45, 93%, 47%)",
            light: "hsl(45, 93%, 90%)",
            dark: "hsl(45, 93%, 30%)",
          },
          unsafe: {
            DEFAULT: "hsl(0, 84%, 60%)",
            light: "hsl(0, 84%, 90%)",
            dark: "hsl(0, 84%, 40%)",
          },
          forest: {
            DEFAULT: "hsl(120, 61%, 30%)",
            light: "hsl(120, 61%, 90%)",
            dark: "hsl(120, 61%, 15%)",
          },
          restricted: {
            DEFAULT: "hsl(210, 10%, 50%)",
            light: "hsl(210, 10%, 90%)",
            dark: "hsl(210, 10%, 30%)",
          },
        },
        // News category colors
        news: {
          emergency: {
            DEFAULT: "hsl(0, 84%, 60%)",
            light: "hsl(0, 84%, 95%)",
            border: "hsl(0, 84%, 80%)",
          },
          alert: {
            DEFAULT: "hsl(25, 95%, 53%)",
            light: "hsl(25, 95%, 95%)",
            border: "hsl(25, 95%, 80%)",
          },
          safety: {
            DEFAULT: "hsl(142, 76%, 36%)",
            light: "hsl(142, 76%, 95%)",
            border: "hsl(142, 76%, 80%)",
          },
          info: {
            DEFAULT: "hsl(221, 83%, 53%)",
            light: "hsl(221, 83%, 95%)",
            border: "hsl(221, 83%, 80%)",
          },
        },
        // Alert priority colors
        priority: {
          critical: {
            DEFAULT: "hsl(0, 84%, 60%)",
            light: "hsl(0, 84%, 95%)",
            border: "hsl(0, 84%, 70%)",
          },
          high: {
            DEFAULT: "hsl(25, 95%, 53%)",
            light: "hsl(25, 95%, 95%)",
            border: "hsl(25, 95%, 70%)",
          },
          medium: {
            DEFAULT: "hsl(45, 93%, 47%)",
            light: "hsl(45, 93%, 95%)",
            border: "hsl(45, 93%, 70%)",
          },
          low: {
            DEFAULT: "hsl(221, 83%, 53%)",
            light: "hsl(221, 83%, 95%)",
            border: "hsl(221, 83%, 70%)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "Menlo", "Monaco", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-out-down": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        "pulse-scale": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-10px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(10px)" },
        },
        "ping-large": {
          "75%, 100%": {
            transform: "scale(2)",
            opacity: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-in-out",
        "fade-out": "fade-out 0.5s ease-in-out",
        "slide-in-up": "slide-in-up 0.3s ease-out",
        "slide-out-down": "slide-out-down 0.3s ease-in",
        "pulse-scale": "pulse-scale 2s ease-in-out infinite",
        "shake": "shake 0.5s ease-in-out",
        "ping-large": "ping-large 1s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
      },
      screens: {
        "xs": "475px",
        "3xl": "1920px",
      },
      boxShadow: {
        "inner-lg": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)",
        "glow": "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-green": "0 0 20px rgba(34, 197, 94, 0.5)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.5)",
        "glow-yellow": "0 0 20px rgba(245, 158, 11, 0.5)",
      },
      backdropBlur: {
        "xs": "2px",
      },
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
      aspectRatio: {
        "4/3": "4 / 3",
        "3/2": "3 / 2",
        "2/3": "2 / 3",
        "9/16": "9 / 16",
      },
      lineHeight: {
        "12": "3rem",
        "14": "3.5rem",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      minHeight: {
        "screen-mobile": "100dvh",
      },
      scale: {
        "102": "1.02",
        "103": "1.03",
      },
      transitionProperty: {
        "height": "height",
        "spacing": "margin, padding",
      },
      blur: {
        "xs": "2px",
      },
      brightness: {
        "25": ".25",
        "175": "1.75",
      },
      contrast: {
        "25": ".25",
        "175": "1.75",
      },
      dropShadow: {
        "glow": [
          "0 0px 20px rgba(255,255, 255, 0.35)",
          "0 0px 65px rgba(255, 255,255, 0.2)"
        ],
      },
      grayscale: {
        "50": "0.5",
      },
      hueRotate: {
        "15": "15deg",
        "30": "30deg",
        "60": "60deg",
        "90": "90deg",
        "270": "270deg",
      },
      invert: {
        "25": ".25",
        "50": ".5",
        "75": ".75",
      },
      saturate: {
        "25": ".25",
        "75": ".75",
        "125": "1.25",
        "175": "1.75",
        "200": "2",
      },
      sepia: {
        "25": ".25",
        "75": ".75",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    // Custom plugin for Northeast India theme utilities
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        '.text-shadow': {
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-md': {
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
        },
        '.text-shadow-lg': {
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        },
        '.text-shadow-none': {
          textShadow: 'none',
        },
        '.safe-area-top': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.safe-area-bottom': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-area-left': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.safe-area-right': {
          paddingRight: 'env(safe-area-inset-right)',
        },
        '.safe-area-inset': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
      }
      addUtilities(newUtilities)
    },
  ],
} satisfies Config;
