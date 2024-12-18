import { RewardToken, MIN_IN_MS } from '../constants'
import { RewardTokenInfo, SignerOrProvider } from '../types'
import { defaultTokenInfo, getTokenInfo } from './token'
import { getCurrentPrice } from './price'
import * as ls from './cache'

const cacheTimeMs = 30 * MIN_IN_MS

export const defaultRewardTokenInfo = (): RewardTokenInfo => ({
  ...defaultTokenInfo(),
  price: 1,
})

export const getRewardTokenInfo = async (
  tokenAddress: string,
  token: RewardToken,
  signerOrProvider: SignerOrProvider,
) => {
  switch (token) {
    case RewardToken.MOCK:
      return getBasicToken(tokenAddress, signerOrProvider)
    case RewardToken.AMPL:
      return getAMPLToken(tokenAddress, signerOrProvider)
    case RewardToken.XCAMPLE:
      return getAMPLToken(tokenAddress, signerOrProvider)
    case RewardToken.WAMPL:
      return getBasicToken(tokenAddress, signerOrProvider)
    case RewardToken.SPOT:
      return getBasicToken(tokenAddress, signerOrProvider)
    case RewardToken.FORTH:
      return getBasicToken(tokenAddress, signerOrProvider)
    default:
      throw new Error(`Handler for ${token} not found`)
  }
}

const getBasicToken = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<RewardTokenInfo> =>
  ls.computeAndCache<RewardTokenInfo>(
    async function () {
      const tokenInfo = await getTokenInfo(tokenAddress, signerOrProvider)
      const price = await getCurrentPrice(tokenInfo.symbol)
      return { price, ...tokenInfo }
    },
    `rewardTokenInfo:${tokenAddress}`,
    cacheTimeMs,
  )

const getAMPLToken = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<RewardTokenInfo> =>
  ls.computeAndCache<RewardTokenInfo>(
    async function () {
      const tokenInfo = await getTokenInfo(tokenAddress, signerOrProvider)
      const price = await getCurrentPrice('AMPL')
      return { price, ...tokenInfo }
    },
    `rewardTokenInfo:${tokenAddress}`,
    cacheTimeMs,
  )
