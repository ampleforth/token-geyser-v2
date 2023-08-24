import { formatUnits } from 'ethers/lib/utils'
import { RewardToken } from '../constants'
import { RewardSchedule, RewardTokenInfo, SignerOrProvider } from '../types'
import { defaultTokenInfo, getTokenInfo } from './token'
import { getCurrentPrice } from './price'

export const defaultRewardTokenInfo = (): RewardTokenInfo => ({
  ...defaultTokenInfo(),
  price: 1,
  getTotalRewards: async () => 0,
})

export const getRewardTokenInfo = async (
  tokenAddress: string,
  token: RewardToken,
  signerOrProvider: SignerOrProvider,
) => {
  switch (token) {
    case RewardToken.MOCK:
      return getBasicToken(tokenAddress, signerOrProvider)
    case RewardToken.SEAM:
      return getBasicToken(tokenAddress, signerOrProvider)
    default:
      throw new Error(`Handler for ${token} not found`)
  }
}

const getBasicToken = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<RewardTokenInfo> => {
  const tokenInfo = await getTokenInfo(tokenAddress, signerOrProvider)
  const price = await getCurrentPrice(tokenInfo.symbol)
  const getTotalRewards = async (rewardSchedules: RewardSchedule[]) =>
    rewardSchedules.reduce((acc, schedule) => acc + parseFloat(formatUnits(schedule.rewardAmount, 0)), 0)
  return {
    ...tokenInfo,
    price,
    getTotalRewards,
  }
}
