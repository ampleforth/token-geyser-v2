import { BigNumber, BigNumberish } from 'ethers'
import { toChecksumAddress } from 'web3-utils'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import {
  getGeyserVaultData,
  getBalanceLocked,
  getCurrentVaultReward,
  getCurrentUnlockedRewards,
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

const statsCacheTimeMs = GEYSER_STATS_CACHE_TIME_MS
const nowInSeconds = () => Math.round(Date.now() / 1000)

export const defaultUserStats = (): UserStats => ({
  apy: 0,
  currentMultiplier: 1.0,
  minMultiplier: 1.0,
  maxMultiplier: 3.0,
  currentReward: 0,
  currentRewardShare: 0,
})

export const defaultGeyserStats = (): GeyserStats => ({
  duration: 0,
  totalDeposit: 0,
  totalDepositVal: 0,
  totalRewards: 0,
  totalRewardVal: 0,
  calcPeriodInDays: 0,
  unlockedRewards: 0,
  bonusRewards: [],
  bonusRewardsVal: 0,
  hasMultiplier: true,
  multiplierDurationInDays: 30,
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
  const geyserDuration = getGeyserDuration(geyser)
  return Math.max(geyserDuration, DAY_IN_SEC)
}

export const getGeyserTotalDeposit = (geyser: Geyser, stakingTokenInfo: StakingTokenInfo) => {
  const { totalStake } = geyser
  const { decimals } = stakingTokenInfo
  const stakingTokenAmount = parseFloat(formatUnits(totalStake, decimals))
  return stakingTokenAmount * stakingTokenInfo.price
}

export const getGeyserTotalRewards = (geyser: Geyser, rewardTokenInfo: RewardTokenInfo) => {
  const { rewardBalance } = geyser
  const { decimals } = rewardTokenInfo
  const rewardAmt = parseFloat(formatUnits(rewardBalance, decimals))
  return rewardAmt * rewardTokenInfo.price
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
      hasMultiplier: geyser.scalingFloor !== geyser.scalingCeiling,
      multiplierDurationInDays: Number(geyser.scalingTime) / DAY_IN_SEC || 30,
      calcPeriodInDays: getCalcPeriod(geyser) / DAY_IN_SEC,
      totalDeposit: parseFloat(formatUnits(geyser.totalStake, stakingTokenInfo.decimals)),
      totalDepositVal: getGeyserTotalDeposit(geyser, stakingTokenInfo),
      totalRewards: parseFloat(formatUnits(geyser.rewardBalance, rewardTokenInfo.decimals)),
      totalRewardVal: getGeyserTotalRewards(geyser, rewardTokenInfo),
      unlockedRewards: parseFloat(formatUnits(geyser.unlockedReward, rewardTokenInfo.decimals)),
      bonusRewards:
        geyser.rewardPoolBalances.length === bonusTokensInfo.length
          ? geyser.rewardPoolBalances.map((b, i) => {
              const info = bonusTokensInfo[i]
              const balance = parseFloat(formatUnits(b.balance, info.decimals))
              return {
                name: info.name,
                symbol: info.symbol,
                balance,
                value: info.price * balance,
              }
            })
          : [],
      bonusRewardsVal:
        geyser.rewardPoolBalances.length === bonusTokensInfo.length
          ? geyser.rewardPoolBalances.reduce((m, b, i) => {
              const info = bonusTokensInfo[i]
              const balance = parseFloat(formatUnits(b.balance, info.decimals))
              return m + info.price * balance
            }, 0)
          : 0,
    }),
    `${toChecksumAddress(geyser.id)}|stats`,
    statsCacheTimeMs,
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
 * Returns the amount of reward token that will be unlocked at the `end`
 */
const getPoolDrip = async (geyser: Geyser, end: number, signerOrProvider: SignerOrProvider) => {
  const endTimeSec = end - (end % 86400) + 86400
  const geyserAddress = toChecksumAddress(geyser.id)
  const d = await ls.computeAndCache<string>(
    async function () {
      const futureRewards = await getFutureUnlockedRewards(geyserAddress, endTimeSec, signerOrProvider)
      const currentRewards = await getCurrentUnlockedRewards(geyserAddress, signerOrProvider)
      return futureRewards.sub(currentRewards).toString()
    },
    `${geyser.id}|${endTimeSec}|poolDrip`,
    statsCacheTimeMs,
  )
  return BigNumber.from(d)
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
  const vaultAddress = toChecksumAddress(lock.id.split('-')[0])
  const geyserAddress = toChecksumAddress(geyser.id)
  const currentUserDrip = await getCurrentVaultReward(vaultAddress, geyserAddress, signerOrProvider)

  const now = nowInSeconds()
  const afterDuration = now + duration
  const poolDrip = await getPoolDrip(geyser, afterDuration, signerOrProvider)
  const stakeUnitsFromAdditionalStake = BigNumber.from(additionalStakes).mul(duration)
  const totalStakeUnitsAfterDuration = getTotalStakeUnits(geyser, afterDuration).add(stakeUnitsFromAdditionalStake)
  const lockStakeUnitsAfterDuration = getLockStakeUnits(lock, afterDuration).add(stakeUnitsFromAdditionalStake)
  if (totalStakeUnitsAfterDuration.isZero()) return 0
  const futureUserDrip = poolDrip.mul(lockStakeUnitsAfterDuration).div(totalStakeUnitsAfterDuration)
  if (futureUserDrip.sub(currentUserDrip).lt('0')) return 0
  const userDrip = futureUserDrip.sub(currentUserDrip)
  return parseInt(userDrip.toString(), 10)
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
  const stakeDrip = poolDrip.mul(stakeUnitsFromStake).div(totalStakeUnitsAfterDuration)
  return parseInt(stakeDrip.toString(), 10)
}

// NOTE: moving to straight APR instead of APY, because rewards don't compound.
// const calculateAPY = (inflow: number, outflow: number, periods: number) => (1 + outflow / inflow) ** periods - 1
const calculateAPY = (inflow: number, outflow: number, periods: number) => (outflow / inflow) * periods

/**
 * APY = (1 + (outflow / inflow)) ** periods - 1
 *
 * inflow = (amount staked by vault * price of the staking token)
 * outflow = (reward that will be unlocked by vault in the next calcPeriod * price of reward token)
 * periods = number of `calcPeriod` in a year
 *
 * calcPeriod = min(geyserDuration, 30 days)
 */
export const getUserAPY = async (
  geyser: Geyser,
  vault: Vault,
  lock: Lock | null,
  stakingTokenInfo: StakingTokenInfo,
  rewardTokenInfo: TokenInfo,
  bonusTokensInfo: BonusTokenInfo[],
  additionalStakes: BigNumberish,
  signerOrProvider: SignerOrProvider,
) =>
  ls.computeAndCache<number>(
    async function () {
      const { decimals: stakingTokenDecimals, price: stakingTokenPrice } = stakingTokenInfo
      const { decimals: rewardTokenDecimals, symbol: rewardTokenSymbol } = rewardTokenInfo
      const rewardTokenPrice = await getCurrentPrice(rewardTokenSymbol)
      const calcPeriod = getCalcPeriod(geyser)
      const drip = await (lock
        ? getUserDrip(geyser, lock, additionalStakes, calcPeriod, signerOrProvider)
        : getStakeDrip(geyser, additionalStakes, calcPeriod, signerOrProvider))

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
      const outflowWithBonus =
        outflow +
        geyser.rewardPoolBalances.reduce((m, b, i) => {
          const bonusPool = parseFloat(formatUnits(b.balance, bonusTokensInfo[i].decimals))
          const bonusReward = rewardShare * bonusPool * bonusTokensInfo[i].price
          return m + bonusReward
        }, 0)

      return calculateAPY(inflow, outflowWithBonus, periods)
    },
    `${toChecksumAddress(geyser.id)}|${toChecksumAddress(vault.id)}|userAPY`,
    statsCacheTimeMs,
  )

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
      const { price: stakingTokenPrice, decimals: stakingTokenDecimals } = stakingTokenInfo
      const { decimals: rewardTokenDecimals, symbol: rewardTokenSymbol } = rewardTokenInfo

      if (!rewardTokenSymbol) return 0
      const rewardTokenPrice = await getCurrentPrice(rewardTokenInfo.symbol)

      const inflowUsd = 1000.0
      const stake = parseUnits((inflowUsd / stakingTokenPrice).toFixed(18), stakingTokenDecimals)

      const calcPeriod = getCalcPeriod(geyser)
      const stakeDripAfterPeriod = await getStakeDrip(geyser, stake, calcPeriod, signerOrProvider)

      const outflowReward = stakeDripAfterPeriod / 10 ** rewardTokenDecimals
      const outflowUsd = outflowReward * rewardTokenPrice
      const periods = YEAR_IN_SEC / calcPeriod

      const rewardPool = parseFloat(formatUnits(geyser.rewardBalance, rewardTokenDecimals))
      const rewardShare = outflowReward / rewardPool
      const bonusUsd = geyser.rewardPoolBalances.reduce((m, b, i) => {
        const bonusPool = parseFloat(formatUnits(b.balance, bonusTokensInfo[i].decimals))
        const bonusReward = rewardShare * bonusPool * bonusTokensInfo[i].price
        return m + bonusReward
      }, 0)

      // TODO: data layer should guarantee that rewardPoolBalances and bonusTokensInfo are inline.
      const outflowWithBonus = outflowUsd + bonusUsd
      return outflowWithBonus === 0 ? 0 : calculateAPY(inflowUsd, outflowWithBonus, periods)
    },
    `${toChecksumAddress(geyser.id)}|poolAPY`,
    statsCacheTimeMs,
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
): Promise<Array<number>> =>
  ls.computeAndCache<Array<number>>(
    async () => {
      const { scalingFloor, scalingCeiling, scalingTime } = geyser
      const geyserAddress = toChecksumAddress(geyser.id)
      const vaultAddress = toChecksumAddress(vault.id)

      const now = nowInSeconds()
      const minMultiplier = 1
      const maxMultiplier = parseInt(scalingCeiling, 10) / parseInt(scalingFloor, 10)

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
      const fraction = geyserVaultData.stakes.length > 0 ? weightedStake / totalStake : 0
      const currentMultiplier = minMultiplier + fraction * (maxMultiplier - minMultiplier)
      return [minMultiplier, currentMultiplier, maxMultiplier]
    },
    `${toChecksumAddress(geyser.id)}|${toChecksumAddress(vault.id)}|minMultiplier`,
    statsCacheTimeMs,
  )

export const getUserStats = async (
  geyser: Geyser,
  vault: Vault | null,
  lock: Lock | null,
  stakingTokenInfo: StakingTokenInfo,
  rewardTokenInfo: TokenInfo,
  bonusTokensInfo: BonusTokenInfo[],
  signerOrProvider: SignerOrProvider,
): Promise<UserStats> =>
  ls.computeAndCache<UserStats>(
    async () => {
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
        : await getUserAPY(geyser, vault, lock, stakingTokenInfo, rewardTokenInfo, bonusTokensInfo, 0, signerOrProvider)

      const m = await getCurrentMultiplier(geyser, vault, lock, signerOrProvider)
      return {
        apy,
        minMultiplier: m[0],
        currentMultiplier: m[1],
        maxMultiplier: m[2],
        currentReward: formattedCurrentRewards,
        currentRewardShare: formattedCurrentRewards / formattedTotalRewards,
      }
    },
    `${toChecksumAddress(geyser.id)}|${toChecksumAddress(vault ? vault.id : 'undefinedvault')}|userStats`,
    statsCacheTimeMs,
  )

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

export const clearGeyserStatsCache = (geyser: Geyser) => {
  localStorage.removeItem(`${toChecksumAddress(geyser.id)}|stats`)
  localStorage.removeItem(`${toChecksumAddress(geyser.id)}|poolAPY`)
}

export const clearUserStatsCache = (geyser: Geyser, vault: Vault) => {
  localStorage.removeItem(`${toChecksumAddress(geyser.id)}|${toChecksumAddress(vault.id)}|userAPY`)
  localStorage.removeItem(`${toChecksumAddress(geyser.id)}|${toChecksumAddress(vault.id)}|userStats`)
  localStorage.removeItem(`${toChecksumAddress(geyser.id)}|${toChecksumAddress(vault.id)}|minMultiplier`)
}
