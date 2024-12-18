import { BigNumberish } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { toChecksumAddress } from 'web3-utils'
import { getCurrentStakeReward } from 'sdk/stats'
import { GeyserStats, UserStats, VaultStats } from 'types'
import {
  defaultGeyserStats,
  defaultUserStats,
  defaultVaultStats,
  getGeyserStats,
  getStakeDrip,
  getUserAPY,
  getUserDrip,
  getUserDripAfterWithdraw,
  getUserStats,
  getVaultStats,
} from 'utils/stats'
import { GeyserContext } from './GeyserContext'
import { VaultContext } from './VaultContext'
import Web3Context from './Web3Context'
import { MONTH_IN_SEC } from '../constants'

export const StatsContext = createContext<{
  userStats: UserStats
  geyserStats: GeyserStats
  vaultStats: VaultStats
  computeRewardsFromUnstake: (unstakeAmount: BigNumberish) => Promise<number>
  computeRewardsShareFromUnstake: (unstakeAmount: BigNumberish) => Promise<number>
  computeAPYFromAdditionalStakes: (stakeAmount: BigNumberish) => Promise<number>
  computeRewardsFromAdditionalStakes: (stakeAmount: BigNumberish) => Promise<number>
  computeRewardsShareFromAdditionalStakes: (stakeAmount: BigNumberish) => Promise<number>
  computeLossFromUnstake1Month: (unstakeAmount: BigNumberish) => Promise<number>
  refreshStats: () => void
}>({
  userStats: defaultUserStats(),
  geyserStats: defaultGeyserStats(),
  vaultStats: defaultVaultStats(),
  computeRewardsFromUnstake: async () => 0,
  computeRewardsShareFromUnstake: async () => 0,
  computeAPYFromAdditionalStakes: async () => 0,
  computeRewardsFromAdditionalStakes: async () => 0,
  computeRewardsShareFromAdditionalStakes: async () => 0,
  computeLossFromUnstake1Month: async () => 0,
  refreshStats: () => {},
})

export const StatsContextProvider: React.FC = ({ children }) => {
  const [userStats, setUserStats] = useState<UserStats>(defaultUserStats())
  const [geyserStats, setGeyserStats] = useState<GeyserStats>(defaultGeyserStats())
  const [vaultStats, setVaultStats] = useState<VaultStats>(defaultVaultStats())

  const { signer, provider, validNetwork } = useContext(Web3Context)
  const { geysers, selectedGeyserInfo, allTokensInfos } = useContext(GeyserContext)
  const { selectedVault, currentLock } = useContext(VaultContext)

  const computeRewardsFromUnstake = async (unstakeAmount: BigNumberish) => {
    const { geyser: selectedGeyser, rewardTokenInfo } = selectedGeyserInfo
    const { decimals } = rewardTokenInfo
    if (selectedGeyser && selectedVault && signer && decimals) {
      const vaultAddress = toChecksumAddress(selectedVault.id)
      const geyserAddress = toChecksumAddress(selectedGeyser.id)
      const computedRewards = await getCurrentStakeReward(vaultAddress, geyserAddress, unstakeAmount, signer)
      return parseFloat(formatUnits(computedRewards, decimals))
    }
    return 0
  }

  const computeRewardsShareFromUnstake = async (unstakeAmount: BigNumberish) => {
    const { geyser: selectedGeyser, rewardTokenInfo } = selectedGeyserInfo
    const { decimals } = rewardTokenInfo
    if (selectedGeyser && decimals) {
      const rewardAmt = await computeRewardsFromUnstake(unstakeAmount)
      const totalAmt = parseFloat(formatUnits(selectedGeyser.rewardBalance, decimals)) || 0.0
      return rewardAmt / totalAmt
    }
    return 0
  }

  const computeAPYFromAdditionalStakes = async (stakeAmount: BigNumberish) => {
    const { geyser: selectedGeyser, stakingTokenInfo, rewardTokenInfo, bonusTokensInfo } = selectedGeyserInfo
    if (selectedGeyser) {
      return getUserAPY(
        selectedGeyser,
        selectedVault,
        currentLock,
        stakingTokenInfo,
        rewardTokenInfo,
        bonusTokensInfo,
        stakeAmount,
        signer || provider,
      )
    }
    return 0
  }

  const computeRewardsFromAdditionalStakes = async (stakeAmount: BigNumberish) => {
    const { geyser: selectedGeyser, rewardTokenInfo } = selectedGeyserInfo
    if (selectedGeyser) {
      const { decimals } = rewardTokenInfo
      if (geyserStats.duration) {
        const drip = await (currentLock
          ? getUserDrip(selectedGeyser, currentLock, stakeAmount, geyserStats.duration, signer || provider)
          : getStakeDrip(selectedGeyser, stakeAmount, geyserStats.duration, signer || provider))
        return drip / 10 ** decimals
      }
    }
    return 0
  }

  const computeRewardsShareFromAdditionalStakes = async (stakeAmount: BigNumberish) => {
    const { geyser: selectedGeyser, rewardTokenInfo } = selectedGeyserInfo
    const { decimals } = rewardTokenInfo
    if (selectedGeyser && decimals) {
      const rewardAmt = await computeRewardsFromAdditionalStakes(stakeAmount)
      const totalAmt = parseFloat(formatUnits(selectedGeyser.rewardBalance, decimals)) || 0.0
      return rewardAmt / totalAmt
    }
    return 0
  }

  const computeLossFromUnstake1Month = async (unstakeAmount: BigNumberish) => {
    const { geyser: selectedGeyser, rewardTokenInfo } = selectedGeyserInfo
    if (selectedGeyser) {
      const { decimals } = rewardTokenInfo
      if (currentLock) {
        const normalGains = await getUserDrip(selectedGeyser, currentLock, '0', MONTH_IN_SEC, signer || provider)
        const gainsAfterUnstake = await getUserDripAfterWithdraw(
          selectedGeyser,
          currentLock,
          unstakeAmount,
          MONTH_IN_SEC,
          signer || provider,
        )
        return parseFloat(formatUnits(Math.round(normalGains - gainsAfterUnstake), decimals))
      }
    }
    return 0
  }

  const refreshStats = async () => {
    const { geyser: selectedGeyser, stakingTokenInfo, rewardTokenInfo, bonusTokensInfo } = selectedGeyserInfo
    if (validNetwork && selectedGeyser && stakingTokenInfo?.address && rewardTokenInfo?.address) {
      setGeyserStats(await getGeyserStats(selectedGeyser, stakingTokenInfo, rewardTokenInfo, bonusTokensInfo))

      let activeLock = null
      if (selectedVault) {
        const lockId = `${selectedVault.id}-${selectedGeyser.id}-${stakingTokenInfo.address.toLowerCase()}`
        activeLock = selectedVault.locks.find((lock) => lock.id === lockId) || null
      }

      setUserStats(
        await getUserStats(
          selectedGeyser,
          selectedVault,
          activeLock,
          stakingTokenInfo,
          rewardTokenInfo,
          bonusTokensInfo,
          signer || provider,
        ),
      )

      setVaultStats(
        await getVaultStats(
          selectedGeyser,
          stakingTokenInfo,
          rewardTokenInfo,
          allTokensInfos,
          selectedVault,
          activeLock,
          signer || provider,
        ),
      )
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (mounted) {
          await refreshStats()
        }
      } catch (e) {
        console.log('stats query error')
        // console.error(e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [geysers, selectedGeyserInfo, selectedVault, currentLock])

  return (
    <StatsContext.Provider
      value={{
        userStats,
        geyserStats,
        vaultStats,
        computeRewardsFromUnstake,
        computeRewardsShareFromUnstake,
        computeAPYFromAdditionalStakes,
        computeRewardsFromAdditionalStakes,
        computeRewardsShareFromAdditionalStakes,
        computeLossFromUnstake1Month,
        refreshStats,
      }}
    >
      {children}
    </StatsContext.Provider>
  )
}
