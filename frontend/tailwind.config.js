// TODO: Use theme config over defining custom styles as much as possible
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    screens: {
      sm: '648px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    fontFamily: {
      times: ['Times\\ New\\ Roman'],
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
      amaranth: '#EE2A4F',
      radicalRed: '#FF2D55',
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
    boxShadow: {
      all: '0 0px 16px rgba(0, 0, 0, 0.3)',
      'all-xs': '0 0px 8px rgba(0, 0, 0, 0.3)',
    },
    extend: {
      width: {
        '80px': '80px',
        sm: '648px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      height: {
        '40px': '40px',
        '72px': '72px',
        '80px': '80px',
        '120px': '120px',
        '180px': '180px',
        '280px': '280px',
        '312px': '312px',
        fit: 'fit-content',
      },
    },
  },
  variants: {
    animation: ['responsive', 'motion-safe', 'motion-reduce'],
    extend: {},
  },
  plugins: [],
}
