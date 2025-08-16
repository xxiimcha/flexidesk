/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#ffcd00",
        ink: "#192230",
        slate: "#3d474e",
        charcoal: "#2c2f38",
      },
    },
  },
  plugins: [],
};
