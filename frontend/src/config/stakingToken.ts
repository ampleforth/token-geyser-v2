import { BigNumber, Signer } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { toChecksumAddress } from 'web3-utils'
import { ERC20Balance } from '../sdk'
import { StakingTokenInfo, TokenComposition } from '../types'
import { getCurrentPrice } from '../utils/price'
import { getTokenInfo } from '../utils/tokens'

export enum StakingToken {
  MOCK,
}

type StakingTokenFunction = (tokenAddress: string, signer: Signer) => Promise<StakingTokenInfo>

export const STAKING_TOKEN_FUNCTION_MAPPING: Record<StakingToken, StakingTokenFunction> = {
  [StakingToken.MOCK]: (address: string, signer: Signer) => getMockLPToken(address, signer),
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

const getMockLPToken = async (tokenAddress: string, signer: Signer): Promise<StakingTokenInfo> => {
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
