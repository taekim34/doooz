import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: "var(--font-sans)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        cardInset: "var(--shadow-card-inset)",
        cta: "var(--shadow-cta-kid)",
      },
      transitionTimingFunction: {
        spring: "var(--ease-spring)",
      },
      transitionDuration: {
        fast: "var(--duration-fast, 200ms)",
        base: "var(--duration-base, 400ms)",
        long: "var(--duration-long, 500ms)",
      },
      animation: {
        fadeInUp: "fadeInUp var(--duration-long) var(--ease-spring) both",
        rise: "rise 640ms var(--ease-spring) both",
        checkPop: "checkPop 720ms var(--ease-spring) both",
        cardIn: "cardIn 400ms var(--ease-spring) 100ms both",
        cardOut: "cardOut 300ms cubic-bezier(0.4,0,1,1) both",
        bounce: "bounce 1.4s ease-in-out 300ms infinite",
        confettiFall: "confettiFall 1.5s cubic-bezier(0.3,0.1,0.6,1) both",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(2rem)", filter: "blur(4px)" },
          to: { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        checkPop: {
          "0%": { transform: "scale(0)" },
          "70%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        cardIn: {
          from: { opacity: "0", transform: "scale(0.8)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        cardOut: {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.95)" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0) rotate(-4deg)" },
          "50%": { transform: "translateY(-6px) rotate(-4deg)" },
        },
        confettiFall: {
          "0%": { opacity: "0", transform: "translateY(-20px) rotate(var(--rot, 0deg))" },
          "10%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(800px) rotate(calc(var(--rot, 0deg) + 540deg))" },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
