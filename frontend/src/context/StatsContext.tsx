import { BigNumberish } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { toChecksumAddress } from 'web3-utils'
import { getCurrentStakeReward } from '../sdk/stats'
import { GeyserStats, UserStats, VaultStats } from '../types'
import { defaultGeyserStats, defaultUserStats, defaultVaultStats, getGeyserStats, getStakeDrip, getUserAPY, getUserDrip, getUserStats, getVaultStats } from '../utils/stats'
import { GeyserContext } from './GeyserContext'
import { VaultContext } from './VaultContext'
import Web3Context from './Web3Context'

export const StatsContext = createContext<{
  userStats: UserStats
  geyserStats: GeyserStats
  vaultStats: VaultStats
  computeRewardsFromUnstake: (unstakeAmount: BigNumberish) => Promise<number>
  computeAPYFromAdditionalStakes: (stakeAmount: BigNumberish) => Promise<number>
  computeRewardsFromAdditionalStakes: (stakeAmount: BigNumberish) => Promise<number>
}>({
  userStats: defaultUserStats(),
  geyserStats: defaultGeyserStats(),
  vaultStats: defaultVaultStats(),
  computeRewardsFromUnstake: async () => 0,
  computeAPYFromAdditionalStakes: async () => 0,
  computeRewardsFromAdditionalStakes: async () => 0,
})

export const StatsContextProvider: React.FC = ({ children }) => {
  const [userStats, setUserStats] = useState<UserStats>(defaultUserStats())
  const [geyserStats, setGeyserStats] = useState<GeyserStats>(defaultGeyserStats())
  const [vaultStats, setVaultStats] = useState<VaultStats>(defaultVaultStats())

  const { signer, defaultProvider } = useContext(Web3Context)
  const { selectedGeyser, rewardTokenInfo, stakingTokenInfo, platformTokenInfos } = useContext(GeyserContext)
  const { selectedVault, currentLock } = useContext(VaultContext)

  const computeRewardsFromUnstake = async (unstakeAmount: BigNumberish) => {
    const { decimals } = rewardTokenInfo
    if (selectedGeyser && selectedVault && signer && decimals) {
      const vaultAddress = toChecksumAddress(selectedVault.id)
      const geyserAddress = toChecksumAddress(selectedGeyser.id)
      const computedRewards = await getCurrentStakeReward(vaultAddress, geyserAddress, unstakeAmount, signer)
      return parseFloat(formatUnits(computedRewards, decimals))
    }
    return 0
  }

  const computeAPYFromAdditionalStakes = async (stakeAmount: BigNumberish) => {
    if (selectedGeyser) {
      return getUserAPY(selectedGeyser, currentLock, stakingTokenInfo, rewardTokenInfo, stakeAmount, signer || defaultProvider)
    }
    return 0
  }

  const computeRewardsFromAdditionalStakes = async (stakeAmount: BigNumberish) => {
    const { decimals } = rewardTokenInfo
    if (selectedGeyser && geyserStats.duration && signer) {
      const drip = await (currentLock
        ? getUserDrip(selectedGeyser, currentLock, stakeAmount, geyserStats.duration, signer)
        : getStakeDrip(selectedGeyser, stakeAmount, geyserStats.duration, signer))
      return parseFloat(formatUnits(Math.round(drip), decimals))
    }
    return 0
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (selectedGeyser && stakingTokenInfo.address && rewardTokenInfo.address) {
          const newGeyserStats = await getGeyserStats(selectedGeyser, stakingTokenInfo, rewardTokenInfo)
          const newUserStats = await getUserStats(selectedGeyser, selectedVault, currentLock, stakingTokenInfo, rewardTokenInfo, signer || defaultProvider)
          const newVaultStats = await getVaultStats(stakingTokenInfo, platformTokenInfos, rewardTokenInfo, selectedVault, currentLock, signer || defaultProvider)
          if (mounted) {
            setGeyserStats(newGeyserStats)
            setUserStats(newUserStats)
            setVaultStats(newVaultStats)
          }
        }
      } catch (e) {
        console.error(e)
      }
    })()
    return () => { mounted = false }
  }, [selectedGeyser, selectedVault, currentLock, stakingTokenInfo.address, rewardTokenInfo.address])

  return (
    <StatsContext.Provider
      value={{
        userStats,
        geyserStats,
        vaultStats,
        computeRewardsFromUnstake,
        computeAPYFromAdditionalStakes,
        computeRewardsFromAdditionalStakes,
      }}
    >
      {children}
    </StatsContext.Provider>
  )
}
