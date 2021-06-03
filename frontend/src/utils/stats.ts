import { BigNumber, Signer } from 'ethers'
import { toChecksumAddress } from 'web3-utils'
import { getCurrentVaultReward, getFutureUnlockedRewards, getFutureVaultReward } from '../sdk/stats'
import { Geyser, GeyserStats, Lock, StakingTokenInfo, TokenInfo, UserStats, Vault, VaultStats } from '../types'
import { ERC20Balance } from '../sdk'
import { DAY_IN_SEC, YEAR_IN_SEC } from '../constants'
import { getCurrentPrice } from './price'

const nowInSeconds = () => Math.round(Date.now() / 1000)

export const defaultUserStats = (): UserStats => ({
  apy: 0,
  currentMultiplier: 0,
  currentReward: BigNumber.from('0'),
})

export const defaultGeyserStats = (): GeyserStats => ({
  duration: 0,
  totalDeposit: 0,
  totalRewardsClaimed: BigNumber.from('0'),
})

export const defaultVaultStats = (): VaultStats => ({
  id: '',
  stakingTokenBalance: BigNumber.from('0'),
  platformTokenBalance: BigNumber.from('0'),
})

const getGeyserDuration = (geyser: Geyser) => {
  const now = nowInSeconds()
  const { rewardSchedules } = geyser
  const schedulesEndTime = rewardSchedules.map(
    (schedule) => parseInt(schedule.start, 10) + parseInt(schedule.duration, 10),
  )
  return Math.max(...schedulesEndTime.map((endTime) => endTime - now), 0)
}

const getGeyserTotalDeposit = (geyser: Geyser, stakingTokenInfo: StakingTokenInfo) => {
  const { totalStake } = geyser
  return parseInt(totalStake, 10) * stakingTokenInfo.price
}

export const getGeyserStats = async (geyser: Geyser, stakingTokenInfo: StakingTokenInfo): Promise<GeyserStats> => ({
  duration: getGeyserDuration(geyser),
  totalDeposit: getGeyserTotalDeposit(geyser, stakingTokenInfo),
  totalRewardsClaimed: BigNumber.from(geyser.totalRewardsClaimed),
})

const getTotalStakeUnits = (geyser: Geyser, timestamp: number) => {
  const { totalStake, totalStakeUnits: cachedTotalStakeUnits, lastUpdate } = geyser
  const lastUpdateTime = parseInt(lastUpdate, 10)
  const durationSinceLastUpdate = Math.max(timestamp - lastUpdateTime, 0)
  return BigNumber.from(cachedTotalStakeUnits).add(BigNumber.from(totalStake).mul(durationSinceLastUpdate))
}

const getLockStakeUnits = (lock: Lock, timestamp: number) => {
  const { amount, stakeUnits: cachedStakeUnits, lastUpdate } = lock
  const lastUpdateTime = parseInt(lastUpdate, 10)
  const durationSinceLastUpdate = Math.max(timestamp - lastUpdateTime, 0)
  return BigNumber.from(cachedStakeUnits).add(BigNumber.from(amount).mul(durationSinceLastUpdate))
}

/**
 * Returns the amount of reward token that will be unlocked between `start` and `end`
 */
const getPoolDrip = async (geyser: Geyser, start: number, end: number, signer: Signer) => {
  if (end <= start) return BigNumber.from('0')
  const geyserAddress = toChecksumAddress(geyser.id)
  return (await getFutureUnlockedRewards(geyserAddress, end, signer)).sub(
    await getFutureUnlockedRewards(geyserAddress, start, signer),
  )
}

/**
 * Returns the amount of reward that the user (vault) will receive after `duration` seconds
 * from the stakes in `lock` and `additionalStakes`, assuming that the max reward multiplier will be
 * achieved after `duration` seconds
 */
const getUserDrip = async (
  geyser: Geyser,
  lock: Lock,
  additionalStakes: BigNumber,
  duration: number,
  signer: Signer,
) => {
  const now = nowInSeconds()
  const afterDuration = now + duration
  const poolDrip = await getPoolDrip(geyser, now, afterDuration, signer)
  const stakeUnitsFromAdditionalStake = additionalStakes.mul(duration)
  const totalStakeUnitsAfterDuration = getTotalStakeUnits(geyser, afterDuration).add(stakeUnitsFromAdditionalStake)
  const lockStakeUnitsAfterDuration = getLockStakeUnits(lock, afterDuration).add(stakeUnitsFromAdditionalStake)
  return poolDrip.mul(lockStakeUnitsAfterDuration).div(totalStakeUnitsAfterDuration)
}

const getStakeDrip = async (geyser: Geyser, stake: BigNumber, duration: number, signer: Signer) => {
  const now = nowInSeconds()
  const afterDuration = now + duration
  const poolDrip = await getPoolDrip(geyser, now, afterDuration, signer)
  const stakeUnitsFromStake = stake.mul(duration)
  const totalStakeUnitsAfterDuration = getTotalStakeUnits(geyser, afterDuration).add(stakeUnitsFromStake)
  return poolDrip.mul(stakeUnitsFromStake).div(totalStakeUnitsAfterDuration)
}

const calculateAPY = (inflow: number, outflow: number, periods: number) => (1 + outflow / inflow) ** periods - 1

/**
 * APY = (1 + (outflow / inflow)) ** periods - 1
 *
 * inflow = (amount staked by vault * price of the staking token)
 * outflow = (reward that will be unlocked by vault in the next `scalingTime * price of reward token)
 * periods = number of `calcPeriod` in a year
 *
 * calcPeriod = max(min(geyserDuration, scalingTime), day)
 */
const getUserAPY = async (
  geyser: Geyser,
  lock: Lock,
  stakingTokenInfo: StakingTokenInfo,
  rewardTokenInfo: TokenInfo,
  signer: Signer,
) => {
  const { scalingTime } = geyser
  const { amount: stakedAmount } = lock
  const { price: stakingTokenPrice } = stakingTokenInfo
  const rewardTokenPrice = await getCurrentPrice(rewardTokenInfo.symbol)
  const geyserDuration = getGeyserDuration(geyser)
  const calcPeriod = Math.max(Math.min(geyserDuration, parseInt(scalingTime, 10)), DAY_IN_SEC)
  const userDripAfterPeriod = await getUserDrip(geyser, lock, BigNumber.from('0'), parseInt(scalingTime, 10), signer)

  const inflow = parseInt(stakedAmount, 10) * stakingTokenPrice
  const outflow = userDripAfterPeriod.mul(rewardTokenPrice).toNumber()
  const periods = YEAR_IN_SEC / calcPeriod
  return calculateAPY(inflow, outflow, periods)
}

/**
 * Pool APY is the APY for a user who makes an average deposit at the current moment in time
 */
const getPoolAPY = async (
  geyser: Geyser,
  stakingTokenInfo: StakingTokenInfo,
  rewardTokenInfo: TokenInfo,
  signer: Signer,
) => {
  const { scalingTime } = geyser
  const { price: stakingTokenPrice } = stakingTokenInfo
  const rewardTokenPrice = await getCurrentPrice(rewardTokenInfo.symbol)

  const inflow = 20000.0 // avg_deposit: 20,000 USD

  const stake = BigNumber.from(Math.round(inflow / stakingTokenPrice))
  const geyserDuration = getGeyserDuration(geyser)
  const calcPeriod = Math.max(Math.min(geyserDuration, parseInt(scalingTime, 10)), DAY_IN_SEC)
  const stakeDripAfterPeriod = await getStakeDrip(geyser, stake, parseInt(scalingTime, 10), signer)

  const outflow = stakeDripAfterPeriod.mul(rewardTokenPrice).toNumber()
  const periods = YEAR_IN_SEC / calcPeriod
  return calculateAPY(inflow, outflow, periods)
}

/**
 * Reward multiplier for the stakes of a vault on a geyser
 *
 * The minimum multiplier is 1, and the maximum multiplier is scalingCeiling / scalingFloor
 *
 * If the current multiplier were maxed, then the rewards from unstaking all stakes
 * would be maxRewards = (currentUnlockedRewards * lockStakeUnits / totalStakeUnits)
 *
 * The actual current multiplier is then { minMultiplier + currentRewards / maxRewards * (maxMultiplier - minMultiplier) }
 */
const getCurrentMultiplier = async (geyser: Geyser, vault: Vault, lock: Lock, signer: Signer) => {
  const { scalingFloor, scalingCeiling } = geyser
  const geyserAddress = toChecksumAddress(geyser.id)
  const vaultAddress = toChecksumAddress(vault.id)

  const now = nowInSeconds()
  const totalStakeUnits = getTotalStakeUnits(geyser, now)
  const lockStakeUnits = getLockStakeUnits(lock, now)

  const currentUnlockedRewards = await getFutureUnlockedRewards(geyserAddress, now, signer)
  const currentRewards = await getFutureVaultReward(vaultAddress, geyserAddress, now, signer)
  const maxRewards = currentUnlockedRewards.mul(lockStakeUnits).div(totalStakeUnits)

  const minMultiplier = 1
  const maxMultiplier = parseInt(scalingCeiling, 10) / parseInt(scalingFloor, 10)

  return (
    minMultiplier +
    currentRewards
      .div(maxRewards)
      .mul(maxMultiplier - minMultiplier)
      .toNumber()
  )
}

export const getUserStats = async (
  geyser: Geyser,
  vault: Vault | null,
  lock: Lock | null,
  stakingTokenInfo: StakingTokenInfo,
  rewardTokenInfo: TokenInfo,
  signer: Signer,
): Promise<UserStats> => {
  if (!vault || !lock) {
    return {
      ...defaultUserStats(),
      apy: await getPoolAPY(geyser, stakingTokenInfo, rewardTokenInfo, signer),
    }
  }
  const vaultAddress = toChecksumAddress(vault.id)
  const geyserAddress = toChecksumAddress(geyser.id)

  return {
    apy: await getUserAPY(geyser, lock, stakingTokenInfo, rewardTokenInfo, signer),
    currentMultiplier: await getCurrentMultiplier(geyser, vault, lock, signer),
    currentReward: await getCurrentVaultReward(vaultAddress, geyserAddress, signer),
  }
}

export const getVaultStats = async (
  stakingTokenInfo: StakingTokenInfo,
  platformTokenInfo: TokenInfo,
  vault: Vault | null,
  signer: Signer,
): Promise<VaultStats> => {
  if (!vault) return defaultVaultStats()
  const vaultAddress = toChecksumAddress(vault.id)
  const { address: stakingTokenAddress } = stakingTokenInfo
  const { address: platformToken } = platformTokenInfo
  const stakingTokenBalance = await ERC20Balance(toChecksumAddress(stakingTokenAddress), vaultAddress, signer)
  const platformTokenBalance = platformToken
    ? await ERC20Balance(toChecksumAddress(platformToken), vaultAddress, signer)
    : BigNumber.from('0')
  return {
    id: vaultAddress,
    stakingTokenBalance,
    platformTokenBalance,
  }
}
