import { HOUR_IN_MS } from '../constants'
import * as ls from './cache'

const DEFAULT_PRICES: Record<string, number> = {
  AMPL: 1.0,
  WAMPL: 30,
  BTC: 20000.0,
  WETH: 1500,
  WAVAX: 20,
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
  PNG: 0.25,
  'yDAI+yUSDC+yUSDT+yTUSD': 1.1,
  SPOT: 1.14,
  FORTH: 2.5,
}

// const SYMBOL_TO_QUERY: Record<string, string> = {
//   WBTC: 'wrapped-bitcoin',
//   AMPL: 'ampleforth',
//   WAMPL: 'wrapped-ampleforth',
//   WETH: 'ethereum',
//   WAVAX: 'avalanche-2',
//   LINK: 'chainlink',
//   BAL: 'balancer',
//   LEND: 'ethlend',
//   COMP: 'compound-governance-token',
//   MKR: 'maker',
//   CRV: 'curve-dao-token',
//   BZRX: 'bzx-protocol',
//   YFI: 'yearn-finance',
//   NMR: 'numeraire',
//   USDC: 'usd-coin',
//   PNG: 'pangolin',
//   'yDAI+yUSDC+yUSDT+yTUSD': 'curve-fi-ydai-yusdc-yusdt-ytusd',
//   SPOT: 'spot',
//   FORTH: 'ampleforth-governance-token',
// }

const URL = "https://web-api.ampleforth.org/util/get-price"

export const getCurrentPrice = async (symbol: string) => {
  const cacheKey = `geyser|${symbol}|spot`
  const TTL = HOUR_IN_MS

  try {
    const response = await fetch(`${URL}?symbol=${symbol}`);
    const price = await response.json();

    return await ls.computeAndCache<number>(
      async () => price as number,
      cacheKey,
      TTL,
    )
  } catch (e) {
    console.error(e)
    return DEFAULT_PRICES[symbol] || 0
  }
}
