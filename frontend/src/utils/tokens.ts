import { Signer } from 'ethers'
import { toChecksumAddress } from 'web3-utils'
import { ERC20Decimals, ERC20Name, ERC20Symbol } from '../sdk'
import { StakingTokenInfo, TokenInfo } from '../types'
import * as ls from './ttl'
import { CONST_CACHE_TIME_MS } from '../constants'
import { StakingToken, STAKING_TOKEN_FUNCTION_MAPPING } from '../config/stakingToken'

export const getTokenInfo = async (
  tokenAddress: string,
  signer: Signer,
  ttl: number = CONST_CACHE_TIME_MS,
): Promise<TokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  const cacheKey = `${address}|tokenInfo`
  const cachedValue = ls.get(cacheKey)
  if (cachedValue) {
    return cachedValue as TokenInfo
  }

  const value: TokenInfo = {
    address,
    name: await ERC20Name(address, signer),
    symbol: await ERC20Symbol(address, signer),
    decimals: await ERC20Decimals(address, signer),
  }

  ls.set(cacheKey, value, ttl)
  return value
}

export const getStakingTokenInfo = async (
  tokenAddress: string,
  token: StakingToken,
  signer: Signer,
): Promise<StakingTokenInfo> => {
  return STAKING_TOKEN_FUNCTION_MAPPING[token](tokenAddress, signer)
}

export const defaultTokenInfo = (): TokenInfo => ({
  address: '',
  name: '',
  symbol: '',
  decimals: 0,
})

export const defaultStakingTokenInfo = (): StakingTokenInfo => ({
  ...defaultTokenInfo(),
  price: 0,
  totalSupply: 0,
  marketCap: 0,
  composition: [],
})
