import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#f5ecd9",
        ink: "#1a1d24",
        brass: "#bb8a39",
        emerald: "#2f6f5e",
        garnet: "#8f2d2d",
        slateglass: "#e4ddd0"
      },
      fontFamily: {
        serifDisplay: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sansBody: ["Trebuchet MS", "Verdana", "sans-serif"]
      },
      boxShadow: {
        dossier: "0 18px 40px rgba(25, 22, 17, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
