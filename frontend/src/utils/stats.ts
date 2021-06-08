import { BigNumber, Signer } from 'ethers'
import { toChecksumAddress } from 'web3-utils'
import { formatUnits } from 'ethers/lib/utils'
import { getCurrentUnlockedRewards, getCurrentVaultReward, getFutureUnlockedRewards } from '../sdk/stats'
import { Geyser, GeyserStats, Lock, StakingTokenInfo, TokenInfo, UserStats, Vault, VaultStats } from '../types'
import { ERC20Balance } from '../sdk'
import { DAY_IN_SEC, YEAR_IN_SEC } from '../constants'
import { getCurrentPrice } from './price'

const nowInSeconds = () => Math.round(Date.now() / 1000)

export const defaultUserStats = (): UserStats => ({
  apy: 0,
  currentMultiplier: 0,
  currentReward: 0,
})

export const defaultGeyserStats = (): GeyserStats => ({
  duration: 0,
  totalDeposit: 0,
  totalRewardsClaimed: 0,
})

export const defaultVaultStats = (): VaultStats => ({
  id: '',
  stakingTokenBalance: 0,
  platformTokenBalances: [],
  rewardTokenBalance: 0,
  currentStake: 0,
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
  const { decimals } = stakingTokenInfo
  const stakingTokenAmount = parseFloat(formatUnits(totalStake, decimals))
  return stakingTokenAmount * stakingTokenInfo.price
}

export const getGeyserStats = async (
  geyser: Geyser,
  stakingTokenInfo: StakingTokenInfo,
  rewardTokenInfo: TokenInfo,
): Promise<GeyserStats> => {
  const { totalRewardsClaimed } = geyser
  const { decimals } = rewardTokenInfo
  const formattedTotalRewardsClaimed = parseFloat(formatUnits(totalRewardsClaimed, decimals))

  return {
    duration: getGeyserDuration(geyser),
    totalDeposit: getGeyserTotalDeposit(geyser, stakingTokenInfo),
    totalRewardsClaimed: formattedTotalRewardsClaimed,
  }
}

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
 * Returns the amount of reward token that will be unlocked between now and `end`
 */
const getPoolDrip = async (geyser: Geyser, end: number, signer: Signer) => {
  const geyserAddress = toChecksumAddress(geyser.id)
  return (await getFutureUnlockedRewards(geyserAddress, end, signer)).sub(
    await getCurrentUnlockedRewards(geyserAddress, signer),
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
  const poolDrip = await getPoolDrip(geyser, afterDuration, signer)
  const stakeUnitsFromAdditionalStake = additionalStakes.mul(duration)
  const totalStakeUnitsAfterDuration = getTotalStakeUnits(geyser, afterDuration).add(stakeUnitsFromAdditionalStake)
  const lockStakeUnitsAfterDuration = getLockStakeUnits(lock, afterDuration).add(stakeUnitsFromAdditionalStake)
  if (totalStakeUnitsAfterDuration.isZero()) return BigNumber.from('0')
  return poolDrip.mul(lockStakeUnitsAfterDuration).div(totalStakeUnitsAfterDuration)
}

const getStakeDrip = async (geyser: Geyser, stake: BigNumber, duration: number, signer: Signer) => {
  const now = nowInSeconds()
  const afterDuration = now + duration
  const poolDrip = await getPoolDrip(geyser, afterDuration, signer)
  const stakeUnitsFromStake = stake.mul(duration)
  const totalStakeUnitsAfterDuration = getTotalStakeUnits(geyser, afterDuration).add(stakeUnitsFromStake)
  if (totalStakeUnitsAfterDuration.isZero()) return BigNumber.from('0')
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
  const { decimals: stakingTokenDecimals, price: stakingTokenPrice } = stakingTokenInfo
  const { decimals: rewardTokenDecimals, symbol: rewardTokenSymbol } = rewardTokenInfo
  const rewardTokenPrice = await getCurrentPrice(rewardTokenSymbol)
  const geyserDuration = getGeyserDuration(geyser)
  const calcPeriod = Math.max(Math.min(geyserDuration, parseInt(scalingTime, 10)), DAY_IN_SEC)
  const userDripAfterPeriod = await getUserDrip(geyser, lock, BigNumber.from('0'), parseInt(scalingTime, 10), signer)

  const inflow = parseFloat(formatUnits(stakedAmount, stakingTokenDecimals)) * stakingTokenPrice
  const outflow = parseFloat(formatUnits(userDripAfterPeriod, rewardTokenDecimals)) * rewardTokenPrice
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
  const { decimals: rewardTokenDecimals, symbol: rewardTokenSymbol } = rewardTokenInfo
  if (!rewardTokenSymbol) return 0
  const rewardTokenPrice = await getCurrentPrice('AMPL')

  const inflow = 20000.0 // avg_deposit: 20,000 USD

  const stake = BigNumber.from(Math.round(inflow / stakingTokenPrice))
  const geyserDuration = getGeyserDuration(geyser)
  const calcPeriod = Math.max(Math.min(geyserDuration, parseInt(scalingTime, 10)), DAY_IN_SEC)
  const stakeDripAfterPeriod = await getStakeDrip(geyser, stake, parseInt(scalingTime, 10), signer)
  if (stakeDripAfterPeriod.isZero()) return 0

  const outflow = parseFloat(formatUnits(stakeDripAfterPeriod, rewardTokenDecimals)) * rewardTokenPrice
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
  const minMultiplier = 1
  const maxMultiplier = parseInt(scalingCeiling, 10) / parseInt(scalingFloor, 10)
  const totalStakeUnits = getTotalStakeUnits(geyser, now)
  const lockStakeUnits = getLockStakeUnits(lock, now)
  if (totalStakeUnits.isZero()) return minMultiplier

  const currentUnlockedRewards = await getCurrentUnlockedRewards(geyserAddress, signer)
  const currentRewards = await getCurrentVaultReward(vaultAddress, geyserAddress, signer)
  const maxRewards = currentUnlockedRewards.mul(lockStakeUnits).div(totalStakeUnits)

  const fraction = parseFloat(formatUnits(currentRewards.mul(100).div(maxRewards), 2))

  return minMultiplier + fraction * (maxMultiplier - minMultiplier)
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
  const { decimals: rewardTokenDecimals } = rewardTokenInfo
  const { amount } = lock
  const currentRewards = await getCurrentVaultReward(vaultAddress, geyserAddress, signer)
  const formattedCurrentRewards = parseFloat(formatUnits(currentRewards, rewardTokenDecimals))
  const apy = BigNumber.from(amount).isZero()
    ? await getPoolAPY(geyser, stakingTokenInfo, rewardTokenInfo, signer)
    : await getUserAPY(geyser, lock, stakingTokenInfo, rewardTokenInfo, signer)
  return {
    apy,
    currentMultiplier: await getCurrentMultiplier(geyser, vault, lock, signer),
    currentReward: formattedCurrentRewards,
  }
}

export const getVaultStats = async (
  stakingTokenInfo: StakingTokenInfo,
  platformTokenInfos: TokenInfo[],
  rewardTokenInfo: TokenInfo,
  vault: Vault | null,
  lock: Lock | null,
  signer: Signer,
): Promise<VaultStats> => {
  if (!vault) return defaultVaultStats()
  const vaultAddress = toChecksumAddress(vault.id)
  const { address: stakingTokenAddress, decimals: stakingTokenDecimals } = stakingTokenInfo
  const { address: rewardTokenAddress, decimals: rewardTokenDecimals } = rewardTokenInfo
  const stakingTokenBalance = await ERC20Balance(toChecksumAddress(stakingTokenAddress), vaultAddress, signer)
  const rewardTokenBalance = await ERC20Balance(toChecksumAddress(rewardTokenAddress), vaultAddress, signer)
  const platformTokenBalances = await Promise.all(
    platformTokenInfos.map(({ address }) => ERC20Balance(toChecksumAddress(address), vaultAddress, signer)),
  )

  const formattedStakingTokenBalance = parseFloat(formatUnits(stakingTokenBalance, stakingTokenDecimals))
  const formattedRewardTokenBalance = parseFloat(formatUnits(rewardTokenBalance, rewardTokenDecimals))
  const formattedPlatformTokenBalances = platformTokenBalances.map((balance, index) =>
    parseFloat(formatUnits(balance, platformTokenInfos[index].decimals)),
  )

  const amount = lock ? lock.amount : '0'
  const currentStake = parseFloat(formatUnits(amount, stakingTokenDecimals))

  return {
    id: vaultAddress,
    stakingTokenBalance: formattedStakingTokenBalance,
    platformTokenBalances: formattedPlatformTokenBalances,
    rewardTokenBalance: formattedRewardTokenBalance,
    currentStake,
  }
}
