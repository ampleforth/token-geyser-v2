import { BigNumber, BigNumberish, Contract, providers, Signer } from 'ethers'
import { loadNetworkConfig } from './utils'

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
