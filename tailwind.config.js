/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Claro Brand Colors
        'claro-red': '#E30613',
        'claro-green': '#4CAF50',
        'claro-warning': '#FF9800',
        'claro-blue': '#1976D2',
        // Background Colors
        'background-light': '#F4F4F4',
        'background-dark': '#121212',
        'card-light': '#FFFFFF',
        'card-dark': '#1E1E1E',
        // Text Colors
        'text-light': '#212121',
        'text-dark': '#FFFFFF',
        'text-secondary-light': '#757575',
        'text-secondary-dark': '#A3A3A3',
        // Legacy support (mapped to Claro colors)
        primary: '#E30613',
        'blue-accent': '#1976D2',
        'green-accent': '#4CAF50',
        'yellow-accent': '#FF9800',
        'red-accent': '#E30613',
      },
      fontFamily: {
        display: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
