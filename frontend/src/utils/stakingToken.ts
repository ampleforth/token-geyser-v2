import { BigNumber, Signer } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { toChecksumAddress } from 'web3-utils'
import { StakingToken } from '../constants'
import { ERC20Balance } from '../sdk'
import { StakingTokenInfo, TokenComposition } from '../types'
import { getCurrentPrice } from './price'
import { defaultTokenInfo, getTokenInfo } from './token'

export const defaultStakingTokenInfo = (): StakingTokenInfo => ({
  ...defaultTokenInfo(),
  price: 0,
  totalSupply: 0,
  marketCap: 0,
  composition: [],
})

export const getStakingTokenInfo = async (
  tokenAddress: string,
  token: StakingToken,
  signer: Signer,
): Promise<StakingTokenInfo> => {
  switch (token) {
    case StakingToken.MOCK:
      return getMockLPToken(tokenAddress, signer)
    default:
      throw new Error(`Handler for ${token} not found`)
  }
}

const getTokenComposition = async (
  tokenAddress: string,
  stakingTokenAddress: string,
  signer: Signer,
  weight: number,
): Promise<TokenComposition> => {
  const { name, symbol, decimals } = await getTokenInfo(tokenAddress, signer)
  const price = await getCurrentPrice(symbol)
  const balance = await ERC20Balance(tokenAddress, stakingTokenAddress, signer)

  const balanceNumber = parseInt(formatUnits(balance as BigNumber, decimals), 10)

  return {
    address: tokenAddress,
    name,
    symbol,
    balance: balanceNumber,
    decimals,
    value: price * balanceNumber,
    weight,
  }
}

export const getMockLPToken = async (tokenAddress: string, signer: Signer): Promise<StakingTokenInfo> => {
  const price = ((await getCurrentPrice('AMPL')) + (await getCurrentPrice('BAL'))) / 2
  return {
    address: toChecksumAddress(tokenAddress),
    name: `MOCK-AMPL-BAL Liquidity Token`,
    symbol: `MOCK-AMPL-BAL`,
    decimals: 18,
    price,
    totalSupply: 100000,
    marketCap: 100000 * price,
    composition: [],
  }
}
