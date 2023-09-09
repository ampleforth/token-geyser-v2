import CGApi from 'coingecko-api'
import { HOUR_IN_MS } from '../constants'
import * as ls from './cache'

const DEFAULT_PRICES: Record<string, number> = {
  WETH: 1500,

  USDC: 1,

  USDbC: 1,
  'OG Points': 1,
}

const SYMBOL_TO_QUERY: Record<string, string> = {
  WETH: 'ethereum',

  USDC: 'usd-coin',

  USDbC: 'bridged-usd-coin-base',
  'OG Points': 'og-points',
  // TODO
}

export const getCurrentPrice = async (symbol: string) => {
  const cacheKey = `geyser|${symbol}|spot`
  const TTL = HOUR_IN_MS

  try {
    const query = SYMBOL_TO_QUERY[symbol]
    if (!query) {
      throw new Error(`Can't fetch price for ${symbol}`)
    }

    return await ls.computeAndCache<number>(
      async () => {
        const client = new CGApi()
        const reqTimeoutSec = 10
        const p: any = await Promise.race([
          client.simple.price({
            ids: [query],
            vs_currencies: ['usd'],
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('request timeout')), reqTimeoutSec * 1000)),
        ])
        const price = p.data[query].usd
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
