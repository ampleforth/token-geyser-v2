// TODO: Use theme config over defining custom styles as much as possible
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    screens: {
      xs: '414px',
      sm: '648px',
      md: '768px',
      'header-wrap': '800px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    fontFamily: {
      times: ['Times\\ New\\ Roman'],
    },
    colors: {
      // TODO
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
      link: '#0D23EE',
      radicalRed: '#FF2D55',
      paleBlue: '#F9F9F9',
      '0D23EE': '#0D23EE',
      header: '#0C356A',
      purpleColor: '#A459D1',
      footer: '#890596',
      cream: '#F8F0E5',
      lightBlue: '#3AB0FF',
      surface: '#77037B',
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
    extend: {
      boxShadow: {
        all: '0 0px 16px rgba(0, 0, 0, 0.3)',
        'all-xs': '0 0px 8px rgba(0, 0, 0, 0.3)',
      },
      width: {
        '16px': '16px',
        '80px': '80px',
        '336px': '336px',
        sm: '648px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      height: {
        '10px': '10px',
        '16px': '16px',
        '40px': '40px',
        '72px': '72px',
        '80px': '80px',
        '120px': '120px',
        '180px': '180px',
        '280px': '280px',
        '312px': '312px',
        fit: 'fit-content',
      },
      minHeight: {
        '300px': '300px',
      },
      maxWidth: {
        '830px': '830px',
      },
    },
  },
  variants: {
    animation: ['responsive', 'motion-safe', 'motion-reduce'],
    extend: {},
  },
  plugins: [],
}
