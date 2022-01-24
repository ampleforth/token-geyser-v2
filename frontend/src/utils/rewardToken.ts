import { Contract } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { RewardToken } from '../constants'
import { RewardSchedule, RewardTokenInfo, SignerOrProvider } from '../types'
import { UFRAGMENTS_ABI } from './abis/UFragments'
import { UFRAGMENTS_POLICY_ABI } from './abis/UFragmentsPolicy'
import { XC_AMPLE_ABI } from './abis/XCAmple'
import { XC_CONTROLLER_ABI } from './abis/XCController'
import { computeAMPLRewardShares } from './ampleforth'
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
  indexStartBlock: number,
) => {
  switch (token) {
    case RewardToken.MOCK:
      return getBasicToken(tokenAddress, signerOrProvider)
    case RewardToken.AMPL:
      return getAMPLToken(tokenAddress, signerOrProvider, indexStartBlock)
    case RewardToken.XCAMPLE:
      return getXCAMPLToken(tokenAddress, signerOrProvider, indexStartBlock)
    case RewardToken.WAMPL:
      return getBasicToken(tokenAddress, signerOrProvider)
    default:
      throw new Error(`Handler for ${token} not found`)
  }
}

const getBasicToken = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<RewardTokenInfo> => {
  const tokenInfo = await getTokenInfo(tokenAddress, signerOrProvider)
  const price = await getCurrentPrice(tokenInfo.symbol)
  const getTotalRewards = async (rewardSchedules: RewardSchedule[]) =>
    rewardSchedules.reduce(
      (acc, schedule) => acc + parseFloat(formatUnits(schedule.rewardAmount, tokenInfo.decimals)),
      0,
    )
  return {
    ...tokenInfo,
    price,
    getTotalRewards,
  }
}

// TODO: use subgraph to get AMPL supply history
const getAMPLToken = async (
  tokenAddress: string,
  signerOrProvider: SignerOrProvider,
  indexStartBlock: number,
): Promise<RewardTokenInfo> => {
  const contract = new Contract(tokenAddress, UFRAGMENTS_ABI, signerOrProvider)
  const tokenInfo = await getTokenInfo(tokenAddress, signerOrProvider)
  const price = await getCurrentPrice('AMPL')

  const policyAddress: string = await contract.monetaryPolicy()
  const policy = new Contract(policyAddress, UFRAGMENTS_POLICY_ABI, signerOrProvider)

  const totalSupply = await contract.totalSupply()
  const epoch = parseInt(await policy.epoch(), 10)

  const getTotalRewards = async (rewardSchedules: RewardSchedule[]) => {
    const totalRewardShares = await computeAMPLRewardShares(
      rewardSchedules,
      tokenAddress,
      policyAddress,
      false,
      epoch,
      tokenInfo.decimals,
      signerOrProvider,
      indexStartBlock,
    )
    return totalRewardShares * totalSupply
  }

  return {
    ...tokenInfo,
    price,
    getTotalRewards,
  }
}

const getXCAMPLToken = async (
  tokenAddress: string,
  signerOrProvider: SignerOrProvider,
  indexStartBlock: number,
): Promise<RewardTokenInfo> => {
  const token = new Contract(tokenAddress, XC_AMPLE_ABI, signerOrProvider)
  const tokenInfo = await getTokenInfo(tokenAddress, signerOrProvider)
  const price = await getCurrentPrice('AMPL')

  // define type XCWAMPL for AVAX
  const controllerAddress: string = await token.controller()
  const controller = new Contract(controllerAddress, XC_CONTROLLER_ABI, signerOrProvider)

  const totalSupply = await token.globalAMPLSupply()
  const epoch = parseInt(await controller.globalAmpleforthEpoch(), 10)

  const getTotalRewards = async (rewardSchedules: RewardSchedule[]) => {
    const totalRewardShares = await computeAMPLRewardShares(
      rewardSchedules,
      tokenAddress,
      controllerAddress,
      true,
      epoch,
      tokenInfo.decimals,
      signerOrProvider,
      indexStartBlock,
    )
    return totalRewardShares * totalSupply
  }

  return {
    ...tokenInfo,
    price,
    getTotalRewards,
  }
}
