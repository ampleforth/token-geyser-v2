import { BigNumber, BigNumberish } from 'ethers'
import { toChecksumAddress } from 'web3-utils'
import { formatUnits } from 'ethers/lib/utils'
import {
  getGeyserVaultData,
  getBalanceLocked,
  getCurrentUnlockedRewards,
  getCurrentVaultReward,
  getFutureUnlockedRewards,
} from '../sdk/stats'
import {
  Geyser,
  GeyserStats,
  Lock,
  RewardTokenInfo,
  SignerOrProvider,
  StakingTokenInfo,
  BonusTokenInfo,
  TokenInfo,
  UserStats,
  Vault,
  VaultStats,
  VaultTokenBalance,
} from '../types'
import { ERC20Balance } from '../sdk'
import { DAY_IN_SEC, GEYSER_STATS_CACHE_TIME_MS, YEAR_IN_SEC } from '../constants'
import { getCurrentPrice } from './price'
import * as ls from './cache'

const nowInSeconds = () => Math.round(Date.now() / 1000)

export const defaultUserStats = (): UserStats => ({
  apy: 0,
  currentMultiplier: 1.0,
  minMultiplier: 1.0,
  maxMultiplier: 1.0,
  currentReward: 0,
  currentRewardShare: 0,
})

export const defaultGeyserStats = (): GeyserStats => ({
  duration: 0,
  totalDeposit: 0,
  totalRewards: 0,
  calcPeriodInDays: 0,
  unlockedRewards: 0,
  bonusRewards: [],
})

export const defaultVaultStats = (): VaultStats => ({
  id: '',
  stakingTokenBalance: 0,
  rewardTokenBalance: 0,
  vaultTokenBalances: [],
  currentStake: 0,
  currentStakeable: BigNumber.from('0'),
})

const getGeyserDuration = (geyser: Geyser) => {
  const now = nowInSeconds()
  const { rewardSchedules } = geyser
  const schedulesEndTime = rewardSchedules.map(
    (schedule) => parseInt(schedule.start, 10) + parseInt(schedule.duration, 10),
  )
  const lastScheduleEndTimeLeft = Math.max(...schedulesEndTime.map((endTime) => endTime - now))
  return Math.max(lastScheduleEndTimeLeft, 0)
}

export const getCalcPeriod = (geyser: Geyser) => {
  const { scalingTime } = geyser
  const geyserDuration = getGeyserDuration(geyser)
  return Math.max(Math.min(geyserDuration, parseInt(scalingTime, 10)), DAY_IN_SEC)
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
  rewardTokenInfo: RewardTokenInfo,
  bonusTokensInfo: BonusTokenInfo[],
): Promise<GeyserStats> =>
  ls.computeAndCache<GeyserStats>(
    async () => ({
      duration: getGeyserDuration(geyser),
      totalDeposit: getGeyserTotalDeposit(geyser, stakingTokenInfo),
      totalRewards:
        (await rewardTokenInfo.getTotalRewards(geyser.rewardSchedules)) / 10 ** (rewardTokenInfo.decimals || 1),
      calcPeriodInDays: getCalcPeriod(geyser) / DAY_IN_SEC,
      unlockedRewards: parseFloat(geyser.unlockedReward) / 10 ** (rewardTokenInfo.decimals || 1),
      bonusRewards:
        geyser.rewardPoolBalances.length === bonusTokensInfo.length
          ? geyser.rewardPoolBalances.map((b, i) => {
              const info = bonusTokensInfo[i]
              const balance = parseFloat(b.balance) / 10 ** info.decimals
              return {
                name: info.name,
                symbol: info.symbol,
                balance,
                value: info.price * balance,
              }
            })
          : [],
    }),
    `${toChecksumAddress(geyser.id)}|stats`,
    GEYSER_STATS_CACHE_TIME_MS,
  )

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
const getPoolDrip = async (geyser: Geyser, end: number, signerOrProvider: SignerOrProvider) => {
  const geyserAddress = toChecksumAddress(geyser.id)
  return (await getFutureUnlockedRewards(geyserAddress, end, signerOrProvider)).sub(
    await getCurrentUnlockedRewards(geyserAddress, signerOrProvider),
  )
}

/**
 * Returns the amount of reward that the user (vault) will receive after `duration` seconds
 * from the stakes in `lock` and `additionalStakes`, assuming that the max reward multiplier will be
 * achieved after `duration` seconds
 */
export const getUserDrip = async (
  geyser: Geyser,
  lock: Lock,
  additionalStakes: BigNumberish,
  duration: number,
  signerOrProvider: SignerOrProvider,
) => {
  const now = nowInSeconds()
  const afterDuration = now + duration
  const poolDrip = await getPoolDrip(geyser, afterDuration, signerOrProvider)
  const stakeUnitsFromAdditionalStake = BigNumber.from(additionalStakes).mul(duration)
  const totalStakeUnitsAfterDuration = getTotalStakeUnits(geyser, afterDuration).add(stakeUnitsFromAdditionalStake)
  const lockStakeUnitsAfterDuration = getLockStakeUnits(lock, afterDuration).add(stakeUnitsFromAdditionalStake)
  if (totalStakeUnitsAfterDuration.isZero()) return 0
  return (
    parseInt(poolDrip.mul(lockStakeUnitsAfterDuration).toString(), 10) /
    parseInt(totalStakeUnitsAfterDuration.toString(), 10)
  )
}

export const getUserDripAfterWithdraw = async (
  geyser: Geyser,
  lock: Lock,
  withdrawAmount: BigNumberish,
  duration: number,
  signerOrProvider: SignerOrProvider,
) => getUserDrip(geyser, lock, BigNumber.from('0').sub(withdrawAmount), duration, signerOrProvider)

export const getStakeDrip = async (
  geyser: Geyser,
  stake: BigNumberish,
  duration: number,
  signerOrProvider: SignerOrProvider,
) => {
  const now = nowInSeconds()
  const afterDuration = now + duration
  const poolDrip = await getPoolDrip(geyser, afterDuration, signerOrProvider)
  const stakeUnitsFromStake = BigNumber.from(stake).mul(duration)
  const totalStakeUnitsAfterDuration = getTotalStakeUnits(geyser, afterDuration).add(stakeUnitsFromStake)
  if (totalStakeUnitsAfterDuration.isZero()) return 0
  return (
    parseInt(poolDrip.mul(stakeUnitsFromStake).toString(), 10) / parseInt(totalStakeUnitsAfterDuration.toString(), 10)
  )
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
export const getUserAPY = async (
  geyser: Geyser,
  lock: Lock | null,
  stakingTokenInfo: StakingTokenInfo,
  rewardTokenInfo: TokenInfo,
  bonusTokensInfo: BonusTokenInfo[],
  additionalStakes: BigNumberish,
  signerOrProvider: SignerOrProvider,
) => {
  const { scalingTime } = geyser
  const { decimals: stakingTokenDecimals, price: stakingTokenPrice } = stakingTokenInfo
  const { decimals: rewardTokenDecimals, symbol: rewardTokenSymbol } = rewardTokenInfo
  const rewardTokenPrice = await getCurrentPrice(rewardTokenSymbol)
  const calcPeriod = getCalcPeriod(geyser)
  const drip = await (lock
    ? getUserDrip(geyser, lock, additionalStakes, parseInt(scalingTime, 10), signerOrProvider)
    : getStakeDrip(geyser, additionalStakes, parseInt(scalingTime, 10), signerOrProvider))

  const stakedAmount = BigNumber.from(additionalStakes)
    .add(lock ? lock.amount : '0')
    .toString()

  const inflowReward = parseFloat(formatUnits(stakedAmount, stakingTokenDecimals))
  const inflow = inflowReward * stakingTokenPrice
  const outflowReward = drip / 10 ** rewardTokenDecimals
  const outflow = outflowReward * rewardTokenPrice
  const periods = YEAR_IN_SEC / calcPeriod

  const rewardPool = parseFloat(geyser.rewardBalance) / 10 ** rewardTokenDecimals
  const rewardShare = outflowReward / rewardPool

  // TODO: data layer should gaurentee that rewardPoolBalances and bonusTokensInfo are inline
  const outflowWithBonus =
    outflow +
    geyser.rewardPoolBalances.reduce((m, b, i) => {
      const bonusPool = parseFloat(formatUnits(b.balance, bonusTokensInfo[i].decimals))
      const bonusReward = rewardShare * bonusPool * bonusTokensInfo[i].price
      return m + bonusReward
    }, 0)

  return calculateAPY(inflow, outflowWithBonus, periods)
}

/**
 * Pool APY is the APY for a user who makes an average deposit at the current moment in time
 */
const getPoolAPY = async (
  geyser: Geyser,
  stakingTokenInfo: StakingTokenInfo,
  rewardTokenInfo: TokenInfo,
  bonusTokensInfo: BonusTokenInfo[],
  signerOrProvider: SignerOrProvider,
) =>
  ls.computeAndCache<number>(
    async () => {
      const { scalingTime } = geyser
      const { price: stakingTokenPrice, decimals: stakingTokenDecimals } = stakingTokenInfo
      const { decimals: rewardTokenDecimals, symbol: rewardTokenSymbol } = rewardTokenInfo
      if (!rewardTokenSymbol) return 0
      const rewardTokenPrice = await getCurrentPrice(rewardTokenInfo.symbol)

      const inflow = 20000.0 // avg_deposit: 20,000 USD
      const inflowDecimals = BigNumber.from((10 ** stakingTokenDecimals).toString())
      const inflowFixedPt = BigNumber.from(inflow).mul(inflowDecimals)
      const stakeTokenPriceBigNum = BigNumber.from(Math.round(stakingTokenPrice))
      const stake = inflowFixedPt.div(stakeTokenPriceBigNum)

      const calcPeriod = getCalcPeriod(geyser)
      const stakeDripAfterPeriod = await getStakeDrip(geyser, stake, parseInt(scalingTime, 10), signerOrProvider)

      const outflowReward = stakeDripAfterPeriod / 10 ** rewardTokenDecimals
      const outflow = outflowReward * rewardTokenPrice
      const periods = YEAR_IN_SEC / calcPeriod

      const rewardPool = parseFloat(formatUnits(geyser.rewardBalance, rewardTokenDecimals))
      const rewardShare = outflowReward / rewardPool

      // TODO: data layer should gaurentee that rewardPoolBalances and bonusTokensInfo are inline
      const outflowWithBonus =
        outflow +
        geyser.rewardPoolBalances.reduce((m, b, i) => {
          const bonusPool = parseFloat(formatUnits(b.balance, bonusTokensInfo[i].decimals))
          const bonusReward = rewardShare * bonusPool * bonusTokensInfo[i].price
          return m + bonusReward
        }, 0)

      return outflowWithBonus === 0 ? 0 : calculateAPY(inflow, outflowWithBonus, periods)
    },
    `${toChecksumAddress(geyser.id)}|poolAPY`,
    GEYSER_STATS_CACHE_TIME_MS,
  )

/**
 * Reward multiplier for the stakes of a vault on a geyser
 *
 * The minimum multiplier is 1, and the maximum multiplier is scalingCeiling / scalingFloor
 *
 * The current scaling factor is calculated as the "remaining bonus time" weighted sun
 * of the users stakes.
 *
 * The actual current multiplier is then { minMultiplier + currentScalingFactor * (maxMultiplier - minMultiplier) }
 */
const getCurrentMultiplier = async (
  geyser: Geyser,
  vault: Vault,
  lock: Lock,
  signerOrProvider: SignerOrProvider,
): Promise<Array<number>> => {
  const { scalingFloor, scalingCeiling, scalingTime } = geyser
  const geyserAddress = toChecksumAddress(geyser.id)
  const vaultAddress = toChecksumAddress(vault.id)

  const now = nowInSeconds()
  const minMultiplier = 1
  const maxMultiplier = parseInt(scalingCeiling, 10) / parseInt(scalingFloor, 10)

  // TODO: can we fetch this from the subgraph?
  const geyserVaultData = await getGeyserVaultData(geyserAddress, vaultAddress, signerOrProvider)
  const totalStake = parseFloat(geyserVaultData.totalStake.toString())
  const st = parseFloat(scalingTime.toString())
  let weightedStake = 0
  geyserVaultData.stakes.forEach((stake) => {
    const amt = parseFloat(stake.amount.toString())
    const ts = parseFloat(stake.timestamp.toString())
    const perc = Math.min(now - ts, st) / st
    weightedStake += perc * amt
  })
  const fraction = weightedStake / totalStake
  const currentMultiplier = minMultiplier + fraction * (maxMultiplier - minMultiplier)
  return [minMultiplier, currentMultiplier, maxMultiplier]
}

export const getUserStats = async (
  geyser: Geyser,
  vault: Vault | null,
  lock: Lock | null,
  stakingTokenInfo: StakingTokenInfo,
  rewardTokenInfo: TokenInfo,
  bonusTokensInfo: BonusTokenInfo[],
  signerOrProvider: SignerOrProvider,
): Promise<UserStats> => {
  if (!vault || !lock) {
    return {
      ...defaultUserStats(),
      apy: await getPoolAPY(geyser, stakingTokenInfo, rewardTokenInfo, bonusTokensInfo, signerOrProvider),
    }
  }
  const vaultAddress = toChecksumAddress(vault.id)
  const geyserAddress = toChecksumAddress(geyser.id)
  const { decimals: rewardTokenDecimals } = rewardTokenInfo
  const { amount } = lock
  const currentRewards = await getCurrentVaultReward(vaultAddress, geyserAddress, signerOrProvider)
  const formattedCurrentRewards = parseFloat(formatUnits(currentRewards, rewardTokenDecimals))
  const formattedTotalRewards = parseFloat(formatUnits(geyser.rewardBalance, rewardTokenDecimals))

  const apy = BigNumber.from(amount).isZero()
    ? await getPoolAPY(geyser, stakingTokenInfo, rewardTokenInfo, bonusTokensInfo, signerOrProvider)
    : await getUserAPY(geyser, lock, stakingTokenInfo, rewardTokenInfo, bonusTokensInfo, 0, signerOrProvider)

  const m = await getCurrentMultiplier(geyser, vault, lock, signerOrProvider)
  return {
    apy,
    minMultiplier: m[0],
    currentMultiplier: m[1],
    maxMultiplier: m[2],
    currentReward: formattedCurrentRewards,
    currentRewardShare: formattedCurrentRewards / formattedTotalRewards,
  }
}

const getVaultTokenBalance = async (
  tokenInfo: TokenInfo,
  vaultAddress: string,
  signerOrProvider: SignerOrProvider,
): Promise<VaultTokenBalance> => {
  const tokenAddress = toChecksumAddress(tokenInfo.address)
  const parsedBalance = await ERC20Balance(tokenAddress, vaultAddress, signerOrProvider)
  const lockedBalance = await getBalanceLocked(vaultAddress, tokenAddress, signerOrProvider)
  const parsedUnlockedBalance = parsedBalance.sub(lockedBalance)
  const balance = parseFloat(formatUnits(parsedBalance, tokenInfo.decimals))
  const unlockedBalance = parseFloat(formatUnits(parsedUnlockedBalance, tokenInfo.decimals))

  return {
    ...tokenInfo,
    address: tokenAddress,
    parsedBalance,
    balance,
    unlockedBalance,
    parsedUnlockedBalance,
  }
}

export const getVaultStats = async (
  geyser: Geyser,
  stakingTokenInfo: StakingTokenInfo,
  rewardTokenInfo: RewardTokenInfo,
  allTokensInfos: TokenInfo[],
  vault: Vault | null,
  lock: Lock | null,
  signerOrProvider: SignerOrProvider,
): Promise<VaultStats> => {
  if (!vault) return defaultVaultStats()
  const vaultAddress = toChecksumAddress(vault.id)

  const addressSet = new Set<string>([stakingTokenInfo.address, rewardTokenInfo.address].map(toChecksumAddress))
  const stakingTokenBalanceInfo = await getVaultTokenBalance(stakingTokenInfo, vaultAddress, signerOrProvider)
  const rewardTokenBalanceInfo = await getVaultTokenBalance(rewardTokenInfo, vaultAddress, signerOrProvider)

  const additionalTokenBalances: VaultTokenBalance[] = (
    await Promise.allSettled(
      allTokensInfos
        .map((tokenInfo) => ({ ...tokenInfo, address: toChecksumAddress(tokenInfo.address) }))
        .filter(({ address }) => {
          const isDuplicate = addressSet.has(address)
          if (!isDuplicate) addressSet.add(address)
          return !isDuplicate
        })
        .map((tokenInfo) => getVaultTokenBalance(tokenInfo, vaultAddress, signerOrProvider)),
    )
  )
    .filter(({ status }) => status === 'fulfilled')
    .map((result) => (result as PromiseFulfilledResult<VaultTokenBalance>).value)

  const vaultTokenBalances = [stakingTokenBalanceInfo, rewardTokenBalanceInfo]
    .concat(additionalTokenBalances)
    .sort((a, b) => (a.symbol < b.symbol ? -1 : 1))

  const amount = lock ? lock.amount : '0'
  const currentStake = parseFloat(formatUnits(amount, stakingTokenInfo.decimals))
  const currentStakeable = stakingTokenBalanceInfo.parsedBalance.sub(amount)

  return {
    id: vaultAddress,
    stakingTokenBalance: stakingTokenBalanceInfo.balance,
    rewardTokenBalance: rewardTokenBalanceInfo.balance,
    vaultTokenBalances,
    currentStake,
    currentStakeable,
  }
}
