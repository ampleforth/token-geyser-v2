import { toChecksumAddress } from 'web3-utils'
import { ERC20Decimals, ERC20Name, ERC20Symbol } from '../sdk'
import { SignerOrProvider, TokenInfo } from '../types'
import * as ls from './cache'
import { CONST_CACHE_TIME_MS } from '../constants'

export const getTokenInfo = async (
  tokenAddress: string,
  signerOrProvider: SignerOrProvider,
  ttl: number = CONST_CACHE_TIME_MS,
): Promise<TokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  return ls.computeAndCache<TokenInfo>(
    async () => {
      const value: TokenInfo = {
        address,
        name: await ERC20Name(address, signerOrProvider),
        symbol: await ERC20Symbol(address, signerOrProvider),
        decimals: await ERC20Decimals(address, signerOrProvider),
      }
      return value
    },
    `${address}|tokenInfo`,
    ttl,
  )
}

export const defaultTokenInfo = (): TokenInfo => ({
  address: '',
  name: '',
  symbol: '',
  decimals: 0,
})
