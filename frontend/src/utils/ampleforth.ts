import { Contract } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { toChecksumAddress } from 'web3-utils'
import { AMPL_LAUNCH_DATE, DAY_IN_MS, INITIAL_SUPPLY } from '../constants'
import { RewardSchedule, SignerOrProvider, SupplyInfo } from '../types'
import { UFRAGMENTS_POLICY_ABI } from './abis/UFragmentsPolicy'
import { loadHistoricalLogs } from './eth'
import * as ls from './cache'

export const getTotalRewardShares = async (
  rewardSchedules: RewardSchedule[],
  policyAddress: string,
  epoch: number,
  decimals: number,
  signerOrProvider: SignerOrProvider,
) => {
  const supplyHistory = await getSupplyHistory(policyAddress, epoch, decimals, signerOrProvider)
  const getShares = (schedule: RewardSchedule) =>
    parseFloat(formatUnits(schedule.rewardAmount, decimals)) / getSupplyOn(parseInt(schedule.start, 10), supplyHistory)
  return rewardSchedules.reduce((acc, schedule) => acc + getShares(schedule), 0)
}

export const getSupplyOn = (timestamp: number, supplyHistory: SupplyInfo[]) => {
  if (supplyHistory.length === 0) return 0

  let index = supplyHistory.findIndex(({ timestamp: ts }) => timestamp < ts)
  if (index < 0) {
    index = supplyHistory.length
  }
  return supplyHistory[Math.max(index - 1, 0)].supply
}

export const getSupplyHistory = async (
  policyAddress: string,
  epoch: number,
  decimals: number,
  signerOrProvider: SignerOrProvider,
) =>
  ls.computeAndCache<SupplyInfo[]>(
    async () => {
      const policy = new Contract(policyAddress, UFRAGMENTS_POLICY_ABI, signerOrProvider)
      const eventLogs = await loadHistoricalLogs(policy, 'LogRebase')
      const historyFromLogs: SupplyInfo[] = eventLogs
        .filter((log) => log.args)
        .map((log) => ({
          timestamp: parseInt(log.args!.timestampSec.toString(), 10),
          supply: parseFloat(formatUnits(log.args!.requestedSupplyAdjustment, decimals)),
          epoch: parseInt(log.args!.epoch, 10),
        }))
      const supplyHistory: SupplyInfo[] = [{ timestamp: AMPL_LAUNCH_DATE, supply: INITIAL_SUPPLY, epoch: 0 }].concat(
        historyFromLogs,
      )
      for (let i = 1; i < supplyHistory.length; i++) {
        supplyHistory[i].supply += supplyHistory[i - 1].supply
      }
      return supplyHistory
    },
    `${toChecksumAddress(policyAddress)}|supplyHistory`,
    DAY_IN_MS,
    (cached) => cached.length > 0 && cached[cached.length - 1].epoch >= epoch,
  )
