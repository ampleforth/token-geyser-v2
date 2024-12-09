import { Contract } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { RewardToken, MIN_IN_MS } from '../constants'
import { RewardSchedule, RewardTokenInfo, SignerOrProvider } from '../types'
import { UFRAGMENTS_ABI } from './abis/UFragments'
import { UFRAGMENTS_POLICY_ABI } from './abis/UFragmentsPolicy'
import { XC_AMPLE_ABI } from './abis/XCAmple'
import { XC_CONTROLLER_ABI } from './abis/XCController'
import { computeAMPLRewardShares } from './ampleforth'
import { defaultTokenInfo, getTokenInfo } from './token'
import { getCurrentPrice } from './price'
import * as ls from './cache'

const cacheTimeMs = 30 * MIN_IN_MS

const nowInSeconds = () => Math.round(Date.now() / 1000)
function filterActiveRewardSchedules(rewardSchedules) {
  const now = nowInSeconds()
  return rewardSchedules.filter((s) => parseInt(s.start, 10) + parseInt(s.duration, 10) > now)
}

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
    case RewardToken.AMPL:
      return getAMPLToken(tokenAddress, signerOrProvider)
    case RewardToken.XCAMPLE:
      return getXCAMPLToken(tokenAddress, signerOrProvider)
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

const getBasicToken = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<RewardTokenInfo> => {
  const rewardTokenInfo = await ls.computeAndCache<RewardTokenInfo>(
    async function () {
      const tokenInfo = await getTokenInfo(tokenAddress, signerOrProvider)
      const price = await getCurrentPrice(tokenInfo.symbol)
      return { price, ...tokenInfo }
    },
    `rewardTokenInfo:${tokenAddress}`,
    cacheTimeMs,
  )
  rewardTokenInfo.getTotalRewards = async (rewardSchedules: RewardSchedule[]) =>
    filterActiveRewardSchedules(rewardSchedules).reduce(
      (acc, schedule) => acc + parseFloat(formatUnits(schedule.rewardAmount, 0)),
      0,
    )
  return rewardTokenInfo
}

// TODO: use subgraph to get AMPL supply history
const getAMPLToken = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<RewardTokenInfo> => {
  const rewardTokenInfo = await ls.computeAndCache<RewardTokenInfo>(
    async function () {
      const tokenInfo = await getTokenInfo(tokenAddress, signerOrProvider)
      const price = await getCurrentPrice('AMPL')
      return { price, ...tokenInfo }
    },
    `rewardTokenInfo:${tokenAddress}`,
    cacheTimeMs,
  )

  rewardTokenInfo.amplInfo = await ls.computeAndCache<any>(
    async function () {
      const contract = new Contract(tokenAddress, UFRAGMENTS_ABI, signerOrProvider)
      const policyAddress: string = await contract.monetaryPolicy()
      const policy = new Contract(policyAddress, UFRAGMENTS_POLICY_ABI, signerOrProvider)
      const totalSupply = await contract.totalSupply()
      const epoch = await policy.epoch()
      return { policyAddress, epoch, totalSupply }
    },
    `amplRewardTokenInfo:${tokenAddress}`,
    cacheTimeMs,
  )

  rewardTokenInfo.getTotalRewards = async (rewardSchedules: RewardSchedule[]) => {
    const tokenInfo = rewardTokenInfo
    const ampl = rewardTokenInfo.amplInfo
    const totalRewardShares = await computeAMPLRewardShares(
      filterActiveRewardSchedules(rewardSchedules),
      tokenAddress,
      ampl.policyAddress,
      false,
      parseInt(ampl.epoch, 10),
      tokenInfo.decimals,
      signerOrProvider,
    )
    return totalRewardShares * formatUnits(ampl.totalSupply, tokenInfo.decimals)
  }

  return rewardTokenInfo
}

const getXCAMPLToken = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<RewardTokenInfo> => {
  const rewardTokenInfo = await ls.computeAndCache<RewardTokenInfo>(
    async function () {
      const tokenInfo = await getTokenInfo(tokenAddress, signerOrProvider)
      const price = await getCurrentPrice('AMPL')
      return { price, ...tokenInfo }
    },
    `rewardTokenInfo:${tokenAddress}`,
    0,
  )

  rewardTokenInfo.amplInfo = await ls.computeAndCache<any>(
    async function () {
      const token = new Contract(tokenAddress, XC_AMPLE_ABI, signerOrProvider)
      const controllerAddress: string = await token.controller()
      const controller = new Contract(controllerAddress, XC_CONTROLLER_ABI, signerOrProvider)
      const totalSupply = await token.globalAMPLSupply()
      const epoch = await controller.globalAmpleforthEpoch()
      return { epoch, totalSupply }
    },
    `xcAmplRewardTokenInfo:${tokenAddress}`,
    cacheTimeMs,
  )

  rewardTokenInfo.getTotalRewards = async (rewardSchedules: RewardSchedule[]) => {
    const tokenInfo = rewardTokenInfo
    const ampl = rewardTokenInfo.amplInfo
    const totalRewardShares = await computeAMPLRewardShares(
      filterActiveRewardSchedules(rewardSchedules),
      tokenAddress,
      controllerAddress,
      true,
      parseInt(ampl.epoch, 10),
      tokenInfo.decimals,
      signerOrProvider,
    )
    return totalRewardShares * formatUnits(ampl.totalSupply, tokenInfo.decimals)
  }

  return rewardTokenInfo
}
