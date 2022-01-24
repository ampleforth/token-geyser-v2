import { BigNumber, BigNumberish, Contract, providers, Signer } from 'ethers'
import { TransactionReceipt } from '@ethersproject/providers'
import { loadNetworkConfig, parseAllEventsFromReceipt } from './utils'
import { VaultData } from './types'

async function _execGeyserFunction<T>(
  geyserAddress: string,
  signerOrProvider: Signer | providers.Provider,
  fnc: string,
  args: any[] = [],
): Promise<T> {
  const config = await loadNetworkConfig(signerOrProvider)
  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signerOrProvider)
  return geyser[fnc](...args) as Promise<T>
}

async function _execVaultFunction<T>(
  vaultAddress: string,
  signerOrProvider: Signer | providers.Provider,
  fnc: string,
  args: any[] = [],
): Promise<T> {
  const config = await loadNetworkConfig(signerOrProvider)
  const vault = new Contract(vaultAddress, config.VaultTemplate.abi, signerOrProvider)
  return vault[fnc](...args) as Promise<T>
}

export const getGeyserVaultData = async (
  geyserAddress: string,
  vaultAddress: string,
  signerOrProvider: Signer | providers.Provider,
) => {
  return _execGeyserFunction<VaultData>(geyserAddress, signerOrProvider, 'getVaultData', [vaultAddress])
}

export const getCurrentVaultReward = async (
  vaultAddress: string,
  geyserAddress: string,
  signerOrProvider: Signer | providers.Provider,
) => {
  return _execGeyserFunction<BigNumber>(geyserAddress, signerOrProvider, 'getCurrentVaultReward', [vaultAddress])
}

export const getFutureVaultReward = async (
  vaultAddress: string,
  geyserAddress: string,
  timestamp: number,
  signerOrProvider: Signer | providers.Provider,
) => {
  return _execGeyserFunction<BigNumber>(geyserAddress, signerOrProvider, 'getFutureVaultReward', [
    vaultAddress,
    timestamp,
  ])
}

export const getCurrentUnlockedRewards = async (
  geyserAddress: string,
  signerOrProvider: Signer | providers.Provider,
) => {
  return _execGeyserFunction<BigNumber>(geyserAddress, signerOrProvider, 'getCurrentUnlockedRewards')
}

export const getFutureUnlockedRewards = async (
  geyserAddress: string,
  timestamp: number,
  signerOrProvider: Signer | providers.Provider,
) => {
  return _execGeyserFunction<BigNumber>(geyserAddress, signerOrProvider, 'getFutureUnlockedRewards', [timestamp])
}

export const getCurrentStakeReward = async (
  vaultAddress: string,
  geyserAddress: string,
  amount: BigNumberish,
  signerOrProvider: Signer | providers.Provider,
) => {
  return _execGeyserFunction<BigNumber>(geyserAddress, signerOrProvider, 'getCurrentStakeReward', [
    vaultAddress,
    amount,
  ])
}

export const getBalanceLocked = async (
  vaultAddress: string,
  tokenAddress: string,
  signerOrProvider: Signer | providers.Provider,
) => {
  return _execVaultFunction<BigNumber>(vaultAddress, signerOrProvider, 'getBalanceLocked', [tokenAddress])
}

export const getRewardsClaimedFromUnstake = async (
  receipt: TransactionReceipt,
  geyserAddress: string,
  signerOrProvider: Signer | providers.Provider,
) => {
  const config = await loadNetworkConfig(signerOrProvider)
  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signerOrProvider)
  const eventLogs = parseAllEventsFromReceipt(receipt, geyser, 'RewardClaimed')
  if (eventLogs.length === 0) return null

  const { rewardToken } = await geyser.getGeyserData()
  const rewardTokenLog = eventLogs.filter((l) => l.args.token === rewardToken)
  return rewardTokenLog.length > 0 ? rewardTokenLog[0].args : null
}
