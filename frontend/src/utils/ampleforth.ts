import { getAmpleforthPolicy, getRebases, getXCAmpleController, getXCRebases, entities } from '@ampleforthorg/sdk'
import { formatUnits } from 'ethers/lib/utils'
import { Signer, providers } from 'ethers'
import { RewardSchedule, SignerOrProvider } from '../types'
import * as ls from './cache'
import { DAY_IN_MS } from '../constants'

const loadXCRebasesFromCache = async (controller: entities.XCController, chainId: number) =>
  ls.computeAndCache<entities.XCRebaseData[]>(
    async () => (await getXCRebases(controller, chainId)).map((r) => r.rawData),
    `${controller.address}|xc_rebases|${controller.epoch.toString()}`,
    DAY_IN_MS,
  )

const loadRebasesFromCache = async (policy: entities.Policy, chainId: number) =>
  ls.computeAndCache<entities.RebaseData[]>(
    async () => (await getRebases(policy, chainId)).map((r) => r.rawData),
    `${policy.address}|rebases|${policy.epoch.toString()}`,
    DAY_IN_MS,
  )

export const computeAMPLRewardShares = async (
  rewardSchedules: RewardSchedule[],
  tokenAddress: string,
  policyAddress: string,
  isCrossChain: boolean,
  epoch: number,
  decimals: number,
  signerOrProvider: SignerOrProvider,
) => {
  const provider = (signerOrProvider as Signer).provider || (signerOrProvider as providers.Provider)
  const { chainId } = await provider.getNetwork()

  if (isCrossChain) {
    const controller = await getXCAmpleController(chainId)
    const rebases = await loadXCRebasesFromCache(controller, chainId)
    controller.loadHistoricalRebases(rebases.map((r) => new entities.XCRebase(r)))
    // const rebases = await getXCRebases(controller, chainId)
    // controller.loadHistoricalRebases(rebases)
    const getShares = (schedule: RewardSchedule) =>
      parseFloat(formatUnits(schedule.rewardAmount, decimals)) / controller.getSupplyOn(schedule.start).toNumber()
    return rewardSchedules.reduce((acc, schedule) => acc + getShares(schedule), 0)
  }

  const policy = await getAmpleforthPolicy(chainId)
  const rebases = await loadRebasesFromCache(policy, chainId)
  policy.loadHistoricalRebases(rebases.map((r) => new entities.Rebase(r)))
  // const rebases = await getRebases(policy, chainId)
  // policy.loadHistoricalRebases(rebases)
  const getShares = (schedule: RewardSchedule) =>
    parseFloat(formatUnits(schedule.rewardAmount, decimals)) / policy.getSupplyOn(schedule.start).toNumber()
  return rewardSchedules.reduce((acc, schedule) => acc + getShares(schedule), 0)
}
