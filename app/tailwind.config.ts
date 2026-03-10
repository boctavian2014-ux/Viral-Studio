import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0b0b0f",
        surface: "#14141c",
        border: "#1c1c24",
        "neon-blue": "#3b82f6",
        "neon-glow": "rgba(59, 130, 246, 0.4)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
