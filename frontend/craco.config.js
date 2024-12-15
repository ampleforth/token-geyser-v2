const path = require('path')

module.exports = {
  style: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },

  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.module.rules.push({
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'node_modules/@web3-onboard/core'),
          path.resolve(__dirname, 'node_modules/@web3-onboard/injected-wallets'),
          path.resolve(__dirname, 'node_modules/@web3-onboard/wagmi'),
          path.resolve(__dirname, 'node_modules/@wagmi'),
          path.resolve(__dirname, 'node_modules/viem'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-proposal-numeric-separator',
              '@babel/plugin-proposal-nullish-coalescing-operator',
              '@babel/plugin-proposal-optional-chaining',
            ],
          },
        },
      })
      return webpackConfig
    },
  },

  babel: {
    plugins: ['@babel/plugin-proposal-nullish-coalescing-operator', '@babel/plugin-proposal-optional-chaining'],
  },
}
