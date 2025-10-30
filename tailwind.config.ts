import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "var(--background)",
          secondary: "var(--background-secondary)",
          tertiary: "var(--background-tertiary)",
        },
        foreground: {
          DEFAULT: "var(--foreground)",
          secondary: "var(--foreground-secondary)",
          muted: "var(--foreground-muted)",
        },
        border: {
          DEFAULT: "var(--border)",
          hover: "var(--border-hover)",
          active: "var(--border-active)",
        },
        accent: {
          primary: "var(--accent-primary)",
          "primary-hover": "var(--accent-primary-hover)",
          secondary: "var(--accent-secondary)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)",
        glass: "var(--glass)",
        "glass-hover": "var(--glass-hover)",
      },
      backgroundImage: {
        "gradient-accent": "linear-gradient(to right, var(--accent-gradient-start), var(--accent-gradient-end))",
        "gradient-accent-vertical": "linear-gradient(to bottom, var(--accent-gradient-start), var(--accent-gradient-end))",
      },
      boxShadow: {
        "theme-sm": "var(--shadow-sm)",
        "theme-md": "var(--shadow-md)",
        "theme-lg": "var(--shadow-lg)",
        "theme-xl": "var(--shadow-xl)",
      },
      borderRadius: {
        "theme-sm": "var(--radius-sm)",
        "theme-md": "var(--radius-md)",
        "theme-lg": "var(--radius-lg)",
        "theme-xl": "var(--radius-xl)",
      },
    },
  },
  plugins: [],
};
export default config;
