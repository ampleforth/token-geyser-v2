import { BigNumber, Contract, Signer } from 'ethers'
import { loadNetworkConfig } from './utils'

async function _execGeyserFunction<T>(
  geyserAddress: string,
  signer: Signer,
  fnc: string,
  args: any[] = [],
): Promise<T> {
  const config = await loadNetworkConfig(signer)
  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signer)
  return geyser[fnc](...args) as Promise<T>
}

export const getCurrentVaultReward = async (vaultAddress: string, geyserAddress: string, signer: Signer) => {
  return _execGeyserFunction<BigNumber>(geyserAddress, signer, 'getCurrentVaultReward', [vaultAddress])
}

export const getFutureVaultReward = async (
  vaultAddress: string,
  geyserAddress: string,
  timestamp: number,
  signer: Signer,
) => {
  return _execGeyserFunction<BigNumber>(geyserAddress, signer, 'getFutureVaultReward', [vaultAddress, timestamp])
}

export const getCurrentUnlockedRewards = async (geyserAddress: string, signer: Signer) => {
  return _execGeyserFunction<BigNumber>(geyserAddress, signer, 'getCurrentUnlockedRewards')
}

export const getFutureUnlockedRewards = async (geyserAddress: string, timestamp: number, signer: Signer) => {
  return _execGeyserFunction<BigNumber>(geyserAddress, signer, 'getFutureUnlockedRewards', [timestamp])
}
