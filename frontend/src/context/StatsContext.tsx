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
  refreshVaultStats: () => void
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
  refreshVaultStats: () => {},
})

export const StatsContextProvider: React.FC = ({ children }) => {
  const [userStats, setUserStats] = useState<UserStats>(defaultUserStats())
  const [geyserStats, setGeyserStats] = useState<GeyserStats>(defaultGeyserStats())
  const [vaultStats, setVaultStats] = useState<VaultStats>(defaultVaultStats())

  const { signer, provider } = useContext(Web3Context)
  const { selectedGeyserInfo, allTokensInfos } = useContext(GeyserContext)
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

  const refreshVaultStats = async () => {
    const { geyser: selectedGeyser, stakingTokenInfo, rewardTokenInfo } = selectedGeyserInfo
    if (selectedGeyser && stakingTokenInfo.address && rewardTokenInfo.address) {
      setVaultStats(
        await getVaultStats(
          selectedGeyser,
          stakingTokenInfo,
          rewardTokenInfo,
          allTokensInfos,
          selectedVault,
          currentLock,
          signer || provider,
        ),
      )
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { geyser: selectedGeyser, stakingTokenInfo, rewardTokenInfo, bonusTokensInfo } = selectedGeyserInfo
        if (selectedGeyser && stakingTokenInfo.address && rewardTokenInfo.address) {
          const newGeyserStats = await getGeyserStats(
            selectedGeyser,
            stakingTokenInfo,
            rewardTokenInfo,
            bonusTokensInfo,
          )
          if (mounted) {
            setGeyserStats(newGeyserStats)
          }
          const newUserStats = await getUserStats(
            selectedGeyser,
            selectedVault,
            currentLock,
            stakingTokenInfo,
            rewardTokenInfo,
            bonusTokensInfo,
            signer || provider,
          )
          if (mounted) {
            setUserStats(newUserStats)
          }
          const newVaultStats = await getVaultStats(
            selectedGeyser,
            stakingTokenInfo,
            rewardTokenInfo,
            allTokensInfos,
            selectedVault,
            currentLock,
            signer || provider,
          )
          if (mounted) {
            setVaultStats(newVaultStats)
          }
        }
      } catch (e) {
        console.log('stats query error')
        console.error(e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [selectedGeyserInfo, selectedVault, currentLock])

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
        refreshVaultStats,
      }}
    >
      {children}
    </StatsContext.Provider>
  )
}
