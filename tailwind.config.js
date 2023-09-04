/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundColor: {
        'gray-5': '#5B606A',
        'gray-6': '#F7F8FC',
        'yellow-3': '#FFEEDD'
      },
      textColor: {
        'gray-5': '#5B606A',
        'gray-4': '#8F9299',
        'gray-2': 'rgba(0, 0, 0, 0.25)',
        'blue-5': '#3B70FF'
      },
      borderColor: {
        'gray-5': '#E8E8E8'
      },
      colors: {
        // 'gray-6': 'rgba(78,89,105,0.06)'
        'gray-6': 'red'
      }
    }
  },
  plugins: [],
  corePlugins: {
    preflight: false
  }
}
