/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {

    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Custom defined colors
        'white': "#fff",
        "white-smoke": "#F2F2F2",
        'black': "#000",
        'eerie-black': "#18181B",
        'battleship-gray': "#979797",
        'dim-gray': "#71717A",
        'french-gray': "#D0D5DD",
        "red": "#EA1B40",
        "dark-red": "#bb1a39",
        "misty-rose": "#FFE5E9",
        "alice-blue": "#E2E8F0",
        "silver": "#C8C8C8",
        "foggy-white": "#EEF0F2",
        "platinum": "#DDE2E4",
        "platinum-btn": "#E7E7E7",
        "platinum-input": "#D5D8DE",
        "gunmetal": "#252C32",
        "seasalt": "#F6F8F9",
        "anti-flash-white": "#EBEBEB",
        "old-gold": "#CFB400",
        "Denim": "#275DAD",
        "green": {
          1: "#34C759",
          2: "#14A166",
          3: '#047644',
        },
        "vista-blue": "#8095E4",
      },
    },
  },
  plugins: [],
};