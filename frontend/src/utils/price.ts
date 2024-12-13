import { MIN_IN_MS } from '../constants'
import * as ls from './cache'

const DEFAULT_PRICES: Record<string, number> = {
  AMPL: 1.19,
  WAMPL: 20,
  BTC: 75000.0,
  WETH: 3000,
  ETH: 2000,
  WAVAX: 20,
  USDC: 1,
  SPOT: 1.3,
  FORTH: 4,
}

const symbolReMap: Record<string, string> = {
  WETH: 'ETH',
}

const URL = 'https://web-api.ampleforth.org/util/get-price'
export const getCurrentPrice = async (symbol_: string) => {
  let symbol = symbol_.toUpperCase()
  symbol = symbolReMap[symbol] || symbol
  const cacheKey = `geyser|${symbol}|spot`
  const TTL = 15 * MIN_IN_MS
  try {
    return await ls.computeAndCache<number>(
      async () => {
        const response = await fetch(`${URL}?symbol=${symbol}`)
        const price = await response.json()
        return price as number
      },
      cacheKey,
      TTL,
    )
  } catch (e) {
    console.error(e)
    return DEFAULT_PRICES[symbol] || 0
  }
}
