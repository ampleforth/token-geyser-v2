module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false,
  variants: {
    animation: ['responsive', 'motion-safe', 'motion-reduce'],
    extend: {},
  },
  theme: {
    extend: {
      spacing: {
        1: '0.25rem',
      },
      fontFamily: {
        sans: ['Avenir', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        mono: ['SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'Courier', 'monospace'],
        helvetica: ['Helvetica', 'sans-serif'],
      },
      fontSize: {
        base: ['1rem', '1.5rem'],
        '2xl': ['1.5rem', '2rem'],
        '3xl': ['1.8rem', '2.2rem'],
        '4xl': ['2rem', '2.5rem'],
        sm: ['14px', '16px'],
        md: ['16px', '20px'],
        xs: ['12px', '14px'],
        xxs: ['10px', '12px'],
      },
      fontWeight: {
        regular: 300,
        bold: 700,
        semiBold: 500,
      },
      colors: {
        primary: '#FF2D55',
        primaryDark: '#EE2A4F',
        secondary: '#912dff',
        secondaryDark: '#7424CC',

        black: '#000',
        white: '#FFF',

        green: '#7ea676',
        greenDark: '#268011',
        greenLight: '#86de26',

        gray: '#979797',
        lightGray: '#DDDDDD',
        mediumGray: '#4A4A4A',
        darkGray: '#1D1D1D',
        lightBlack: '#363636',

        link: '#0D23EE',
        radicalRed: '#FF2D55',
        paleBlue: '#F9F9F9',
        '0D23EE': '#0D23EE',
      },
      borderRadius: {
        none: '0px',
        sm: '10px',
      },
      // boxShadow: {
      //   none: 'none',
      // },

      // TODO:remove
      boxShadow: {
        all: '0 0px 16px rgba(0, 0, 0, 0.3)',
        'all-xs': '0 0px 8px rgba(0, 0, 0, 0.3)',
      },

      width: {
        '16px': '16px',
        '65px': '65px',
        '80px': '80px',
        '120px': '120px',
        '336px': '336px',
        btnsm: '120px',
        sm: '638px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      height: {
        btnsm: '40px',
        '10px': '10px',
        '16px': '16px',
        '40px': '40px',
        '65px': '65px',
        '72px': '72px',
        '80px': '80px',
        '120px': '120px',
        '180px': '180px',
        '280px': '280px',
        '312px': '312px',
        fit: 'fit-content',
      },
      padding: {
        1: '5px',
      },
      minHeight: {
        '180px': '180px',
        '300px': '300px',
      },
      maxWidth: {
        '830px': '830px',
      },
    },
  },
  variants: {},
}
