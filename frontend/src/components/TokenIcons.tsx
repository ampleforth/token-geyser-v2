import React from 'react'

import amplIcon from 'assets/tokens/ampl.png'
import forthIcon from 'assets/tokens/forth.png'
import spotIcon from 'assets/tokens/spot.png'
import usdcIcon from 'assets/tokens/usdc.png'
import wamplIcon from 'assets/tokens/wampl.png'
import wbtcIcon from 'assets/tokens/wbtc.png'
import wethIcon from 'assets/tokens/weth.png'

function getTokenIcon(token) {
  switch (token.toLowerCase()) {
    case 'ampl':
      return amplIcon
    case 'forth':
      return forthIcon
    case 'spot':
      return spotIcon
    case 'usdc':
      return usdcIcon
    case 'wampl':
      return wamplIcon
    case 'wbtc':
      return wbtcIcon
    case 'weth':
      return wethIcon
    default:
      return amplIcon
  }
}

const TokenIcons = ({ tokens }) => (
  <div className="flex bg-gray-900 p-4 items-center">
    {tokens.map((token, index) => (
      <div
        key={token}
        className={`
              rounded-full bg-white flex items-center justify-center w-9 h-9
              border border-gray
              ${index > 0 ? '-ml-3' : ''}
            `}
      >
        <img src={getTokenIcon(token)} alt={token} className="h-6 w-6" />
      </div>
    ))}
  </div>
)

export default TokenIcons
