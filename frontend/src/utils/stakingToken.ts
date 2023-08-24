import { BigNumber, Contract } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { toChecksumAddress } from 'web3-utils'
import { StakingToken } from '../constants'
import { SignerOrProvider, StakingTokenInfo } from '../types'
import { WRAPPED_ERC20_ABI } from './abis/WrappedERC20'
import { AAVEV2_DEPOSIT_TOKEN } from './abis/AaveV2DepositToken'
import { getCurrentPrice } from './price'
import { defaultTokenInfo, getTokenInfo } from './token'

export const defaultStakingTokenInfo = (): StakingTokenInfo => ({
  ...defaultTokenInfo(),
  price: 0,
  composition: [],
  wrappedToken: null,
})

export const getStakingTokenInfo = async (
  tokenAddress: string,
  token: StakingToken,
  signerOrProvider: SignerOrProvider,
): Promise<StakingTokenInfo> => {
  switch (token) {
    case StakingToken.MOCK:
      return getMockLPToken(tokenAddress)
    case StakingToken.WAMPL:
      return getBasicToken(tokenAddress, signerOrProvider)
    case StakingToken.SEAM:
      return getBasicToken(tokenAddress, signerOrProvider)
    // TODO
    case StakingToken.SEAMLESS_ATOKEN:
      return getAaveV3(tokenAddress, signerOrProvider)
    default:
      throw new Error(`Handler for ${token} not found`)
  }
}

const getMockLPToken = async (tokenAddress: string): Promise<StakingTokenInfo> => {
  const price = ((await getCurrentPrice('AMPL')) + (await getCurrentPrice('BAL'))) / 2
  return {
    address: toChecksumAddress(tokenAddress),
    name: `MOCK-AMPL-BAL Liquidity Token`,
    symbol: `MOCK-AMPL-BAL`,
    decimals: 18,
    price,
    composition: [],
    wrappedToken: null,
  }
}

const getAaveV3 = async (wrapperTokenAddress: string, signerOrProvider: SignerOrProvider): Promise<StakingTokenInfo> =>
  getAaveV2(wrapperTokenAddress, signerOrProvider)

const getAaveV2 = async (
  wrapperTokenAddress: string,
  signerOrProvider: SignerOrProvider,
): Promise<StakingTokenInfo> => {
  const wrapperAddress = toChecksumAddress(wrapperTokenAddress)
  const wrapperContract = new Contract(wrapperAddress, WRAPPED_ERC20_ABI, signerOrProvider)

  // aAMPL
  const wrappedAddress = await wrapperContract.underlying()
  const wrappedContract = new Contract(wrappedAddress, AAVEV2_DEPOSIT_TOKEN, signerOrProvider)

  // AMPL
  const baseAssetAddress = await wrappedContract.UNDERLYING_ASSET_ADDRESS()

  // infos
  const wrapperInfo = await getTokenInfo(wrapperAddress, signerOrProvider)
  const wrappedInfo = await getTokenInfo(wrappedAddress, signerOrProvider)
  const baseAssetInfo = await getTokenInfo(baseAssetAddress, signerOrProvider)

  // aAMPL held by the wrapper contract
  const totalUnderlying = await wrapperContract.totalUnderlying()
  const totalUnderlyingNumber = parseFloat(formatUnits(totalUnderlying, wrappedInfo.decimals))

  // aAMPL composition
  const baseAssetPrice = await getCurrentPrice(baseAssetInfo.symbol)
  const tokenCompositions = [
    {
      address: baseAssetInfo.address,
      name: baseAssetInfo.name,
      symbol: baseAssetInfo.symbol,
      decimals: baseAssetInfo.decimals,
      balance: totalUnderlyingNumber,
      price: baseAssetPrice,
      value: baseAssetPrice * totalUnderlyingNumber,
      weight: 1.0,
    },
  ]

  const wrapperTotalSupply: BigNumber = await wrapperContract.totalSupply()
  const wrapperTotalSupplyNumber = parseFloat(formatUnits(wrapperTotalSupply, wrapperInfo.decimals))
  const wrapperMarketCap = totalUnderlyingNumber * baseAssetPrice
  return {
    address: wrapperInfo.address,
    decimals: wrapperInfo.decimals,
    name: wrapperInfo.name,
    symbol: wrapperInfo.symbol,
    price: wrapperMarketCap / wrapperTotalSupplyNumber,
    composition: tokenCompositions,
    wrappedToken: {
      address: wrappedInfo.address,
      decimals: wrappedInfo.decimals,
      name: wrappedInfo.name,
      symbol: wrappedInfo.symbol,
      price: baseAssetPrice,
    },
  }
}

const getBasicToken = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<StakingTokenInfo> => {
  const address = toChecksumAddress(tokenAddress)
  const tokenInfo = await getTokenInfo(address, signerOrProvider)
  const price = await getCurrentPrice(tokenInfo.symbol)
  return {
    ...tokenInfo,
    price,
    composition: [],
    wrappedToken: null,
  }
}
