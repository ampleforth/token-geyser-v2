import { Contract } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { toChecksumAddress } from 'web3-utils'
import { AMPL_LAUNCH_DATE, DAY_IN_MS, INITIAL_SUPPLY } from '../constants'
import { RewardSchedule, SignerOrProvider, SupplyInfo } from '../types'
import { UFRAGMENTS_ABI } from './abis/UFragments'
import { UFRAGMENTS_POLICY_ABI } from './abis/UFragmentsPolicy'
import { XC_CONTROLLER_ABI } from './abis/XCController'
import { loadHistoricalLogs } from './eth'
import * as ls from './cache'

export const computeAMPLRewardShares = async (
  rewardSchedules: RewardSchedule[],
  tokenAddress: string,
  policyAddress: string,
  isCrossChain: boolean,
  epoch: number,
  decimals: number,
  signerOrProvider: SignerOrProvider,
  indexBlock: number,
) => {
  const supplyHistory = await getSupplyHistory(
    tokenAddress,
    policyAddress,
    isCrossChain,
    epoch,
    decimals,
    signerOrProvider,
    indexBlock,
  )
  const getShares = (schedule: RewardSchedule) =>
    parseFloat(formatUnits(schedule.rewardAmount, decimals)) / getSupplyOn(parseInt(schedule.start, 10), supplyHistory)
  return rewardSchedules.reduce((acc, schedule) => acc + getShares(schedule), 0)
}

const getSupplyOn = (timestamp: number, supplyHistory: SupplyInfo[]) => {
  if (supplyHistory.length === 0) return 0
  let index = supplyHistory.findIndex(({ timestamp: ts }) => timestamp < ts)
  if (index < 0) {
    index = supplyHistory.length
  }
  return supplyHistory[Math.max(index - 1, 0)].supply
}

const getSupplyHistory = async (
  tokenAddress: string,
  policyAddress: string,
  isCrossChain: boolean,
  epoch: number,
  decimals: number,
  signerOrProvider: SignerOrProvider,
  indexBlock: number,
) =>
  ls.computeAndCache<SupplyInfo[]>(
    async () => {
      const token = new Contract(tokenAddress, UFRAGMENTS_ABI, signerOrProvider)
      const policy = new Contract(
        policyAddress,
        isCrossChain ? XC_CONTROLLER_ABI : UFRAGMENTS_POLICY_ABI,
        signerOrProvider,
      )

      const tokenLogs = await loadHistoricalLogs(token, 'LogRebase', signerOrProvider, indexBlock)
      const policyLogs = await loadHistoricalLogs(policy, 'LogRebase', signerOrProvider, indexBlock)

      if (tokenLogs.length !== policyLogs.length) {
        throw new Error('Rebase Log mismatch')
      }

      const historyFromLogs: SupplyInfo[] = tokenLogs.map((tl, i) => {
        const pl = policyLogs[i]
        return {
          timestamp: parseInt(pl.args!.timestampSec.toString(), 10),
          supply: parseFloat(formatUnits(tl.args!.totalSupply, decimals)),
          epoch: parseInt(tl.args!.epoch, 10),
        }
      })
      const supplyHistory: SupplyInfo[] = [{ timestamp: AMPL_LAUNCH_DATE, supply: INITIAL_SUPPLY, epoch: 0 }].concat(
        historyFromLogs,
      )
      return supplyHistory
    },
    `${toChecksumAddress(policyAddress)}|supplyHistory`,
    DAY_IN_MS,
    (cached) => cached.length > 0 && cached[cached.length - 1].epoch >= epoch,
  )
