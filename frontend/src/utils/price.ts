import CGApi from 'coingecko-api'
import { HOUR_IN_MS } from '../constants'
import * as ls from './ttl'

const DEFAULT_PRICES: Record<string, number> = {
  AMPL: 1.0,
  BTC: 50000.0,
  WETH: 320,
  LINK: 5,
  BAL: 10,
  LEND: 0.33,
  COMP: 100,
  MKR: 350,
  CRV: 0.5,
  BZRX: 0.1,
  YFI: 17000,
  NMR: 25,
  USDC: 1,
  'yDAI+yUSDC+yUSDT+yTUSD': 1.1,
}

const SYMBOL_TO_QUERY: Record<string, string> = {
  WBTC: 'wrapped-bitcoin',
  AMPL: 'ampleforth',
  WETH: 'ethereum',
  LINK: 'chainlink',
  BAL: 'balancer',
  LEND: 'ethlend',
  COMP: 'compound-governance-token',
  MKR: 'maker',
  CRV: 'curve-dao-token',
  BZRX: 'bzx-protocol',
  YFI: 'yearn-finance',
  NMR: 'numeraire',
  USDC: 'usd-coin',
  'yDAI+yUSDC+yUSDT+yTUSD': 'curve-fi-ydai-yusdc-yusdt-ytusd',
}

export const getCurrentPrice = async (symbol: string) => {
  const cacheKey = `geyser|${symbol}|spot`
  const TTL = HOUR_IN_MS

  try {
    const query = SYMBOL_TO_QUERY[symbol]
    if (!query) {
      throw new Error(`Can't fetch price for ${symbol}`)
    }
    const cachedPrice = ls.get(cacheKey)
    if (cachedPrice) {
      return cachedPrice as number
    }

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
    ls.set(cacheKey, price, TTL)
    return price as number
  } catch (e) {
    console.error(e)
    return DEFAULT_PRICES[symbol] || 0
  }
}
