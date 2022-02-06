import {
  getAmpleforthPolicy,
  getRebases,
  getXCAmpleController,
  getXCRebases,
} from '@ampleforthorg/sdk';
import { formatUnits } from 'ethers/lib/utils'
import { Signer, providers } from 'ethers'
import { RewardSchedule, SignerOrProvider } from '../types'
// import * as ls from './cache'


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
  const {chainId} = await provider.getNetwork()

  if(isCrossChain){
    const controller = await getXCAmpleController(chainId)
    const rebases = await getXCRebases(controller, chainId)
    controller.loadHistoricalRebases(rebases)
    const getShares = (schedule: RewardSchedule) =>
      parseFloat(formatUnits(schedule.rewardAmount, decimals)) / controller.getSupplyOn(schedule.start).toNumber()
    return rewardSchedules.reduce((acc, schedule) => acc + getShares(schedule), 0)
  }

  const policy = await getAmpleforthPolicy(chainId)
  const rebases = await getRebases(policy, chainId)
  policy.loadHistoricalRebases(rebases)
  const getShares = (schedule: RewardSchedule) =>
    parseFloat(formatUnits(schedule.rewardAmount, decimals)) / policy.getSupplyOn(schedule.start).toNumber()
  return rewardSchedules.reduce((acc, schedule) => acc + getShares(schedule), 0)
}
