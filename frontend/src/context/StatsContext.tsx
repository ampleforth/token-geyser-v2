import { BigNumberish } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { toChecksumAddress } from 'web3-utils'
import { getCurrentStakeReward } from '../sdk/stats'
import { GeyserStats, UserStats, VaultStats } from '../types'
import { defaultGeyserStats, defaultUserStats, defaultVaultStats, getGeyserStats, getUserStats, getVaultStats } from '../utils/stats'
import { GeyserContext } from './GeyserContext'
import { VaultContext } from './VaultContext'
import Web3Context from './Web3Context'

export const StatsContext = createContext<{
  userStats: UserStats
  geyserStats: GeyserStats
  vaultStats: VaultStats
  computeRewardsFromUnstake: (unstakeAmount: BigNumberish) => Promise<number>
}>({
  userStats: defaultUserStats(),
  geyserStats: defaultGeyserStats(),
  vaultStats: defaultVaultStats(),
  computeRewardsFromUnstake: async () => 0,
})

export const StatsContextProvider: React.FC = ({ children }) => {
  const [userStats, setUserStats] = useState<UserStats>(defaultUserStats())
  const [geyserStats, setGeyserStats] = useState<GeyserStats>(defaultGeyserStats())
  const [vaultStats, setVaultStats] = useState<VaultStats>(defaultVaultStats())

  const { signer } = useContext(Web3Context)
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

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (signer && selectedGeyser) {
          const newGeyserStats = await getGeyserStats(selectedGeyser, stakingTokenInfo, rewardTokenInfo)
          const newUserStats = await getUserStats(selectedGeyser, selectedVault, currentLock, stakingTokenInfo, rewardTokenInfo, signer)
          const newVaultStats = await getVaultStats(stakingTokenInfo, platformTokenInfos, rewardTokenInfo, selectedVault, currentLock, signer)
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
  }, [signer, selectedGeyser, selectedVault, currentLock])

  return (
    <StatsContext.Provider value={{ userStats, geyserStats, vaultStats, computeRewardsFromUnstake }}>
      {children}
    </StatsContext.Provider>
  )
}
