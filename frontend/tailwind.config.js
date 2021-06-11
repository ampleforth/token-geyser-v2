// TODO: Use theme config over defining custom styles as much as possible
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      roboto: ['Roboto', 'sans-serif'],
      robotoMono: ['Roboto Mono', 'sans-serif'],
      times: ['Times New Roman'],
    },
    colors: {
      primary: '#912DFF',
      secondary: '#FFFFFF',
      lightGray: '#DDDDDD',
      gray: '#979797',
      mediumGray: '#4A4A4A',
      darkGray: '#1D1D1D',
      lightBlack: '#363636',
      black: '#000000',
      white: '#FFFFFF',
      paleBlue: '#F9F9F9',
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    extend: {},
  },
  variants: {
    animation: ['responsive', 'motion-safe', 'motion-reduce'],
    extend: {},
  },
  plugins: [],
}
