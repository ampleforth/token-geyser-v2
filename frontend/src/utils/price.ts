import { HOUR_IN_MS } from '../constants'
import * as ls from './cache'

const DEFAULT_PRICES: Record<string, number> = {
  AMPL: 1.1,
  WAMPL: 10,
  BTC: 45000.0,
  WETH: 2000,
  ETH: 2000,
  WAVAX: 20,
  USDC: 1,
  SPOT: 1.14,
  FORTH: 2.5,
}

const symbolReMap: Record<string, string> = {
  WETH: 'ETH'
}

const URL = 'https://web-api.ampleforth.org/util/get-price'
export const getCurrentPrice = async (symbol_: string) => {
  let symbol = symbol_.toUpperCase()
  symbol = (symbolReMap[symbol] || symbol)

  const cacheKey = `geyser|${symbol}|spot`
  const TTL = HOUR_IN_MS

  try {
    const response = await fetch(`${URL}?symbol=${symbol}`)
    const price = await response.json()
    return await ls.computeAndCache<number>(async () => price as number, cacheKey, TTL)
  } catch (e) {
    console.error(e)
    return DEFAULT_PRICES[symbol] || 0
  }
}
