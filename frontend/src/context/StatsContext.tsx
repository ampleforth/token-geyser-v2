import React, { createContext, useContext, useEffect, useState } from 'react'
import { GeyserStats, UserStats, VaultStats } from '../types'
import { defaultGeyserStats, defaultUserStats, defaultVaultStats, getGeyserStats, getUserStats, getVaultStats } from '../utils/stats'
import { GeyserContext } from './GeyserContext'
import { VaultContext } from './VaultContext'
import Web3Context from './Web3Context'

export const StatsContext = createContext<{
  userStats: UserStats
  geyserStats: GeyserStats
  vaultStats: VaultStats
}>({
  userStats: defaultUserStats(),
  geyserStats: defaultGeyserStats(),
  vaultStats: defaultVaultStats(),
})

export const StatsContextProvider: React.FC = ({ children }) => {
  const [userStats, setUserStats] = useState<UserStats>(defaultUserStats())
  const [geyserStats, setGeyserStats] = useState<GeyserStats>(defaultGeyserStats())
  const [vaultStats, setVaultStats] = useState<VaultStats>(defaultVaultStats())

  const { signer } = useContext(Web3Context)
  const { selectedGeyser, rewardTokenInfo, stakingTokenInfo, platformTokenInfo } = useContext(GeyserContext)
  const { selectedVault, currentLock } = useContext(VaultContext)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (signer && selectedGeyser) {
          const newGeyserStats = await getGeyserStats(selectedGeyser, stakingTokenInfo, rewardTokenInfo)
          const newUserStats = await getUserStats(selectedGeyser, selectedVault, currentLock, stakingTokenInfo, rewardTokenInfo, signer)
          const newVaultStats = await getVaultStats(stakingTokenInfo, platformTokenInfo, rewardTokenInfo, selectedVault, currentLock, signer)
          if (mounted) {
            setGeyserStats(newGeyserStats)
            setUserStats(newUserStats)
            setVaultStats(newVaultStats)
            console.log({
              newGeyserStats,
              newUserStats,
              newVaultStats,
            })
          }
        }
      } catch (e) {
        console.error(e)
      }
    })()
    return () => { mounted = false }
  }, [signer, selectedGeyser, selectedVault, currentLock])

  return (
    <StatsContext.Provider value={{ userStats, geyserStats, vaultStats }}>
      {children}
    </StatsContext.Provider>
  )
}
