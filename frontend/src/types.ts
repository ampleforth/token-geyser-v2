import { BigNumber, providers, Signer } from 'ethers'
import { RewardToken, StakingToken } from './constants'

type ClaimedReward = {
  id: string
  token: string
  amount: string
  lastUpdate: string
}

export type Vault = {
  id: string
  nonce: string
  claimedReward: ClaimedReward[]
  locks: Lock[]
}

export enum GeyserStatus {
  ONLINE = 'Online',
  OFFLINE = 'Offline',
  SHUTDOWN = 'Shutdown',
}

export type RewardSchedule = {
  id: string
  duration: string
  start: string
  rewardAmount: string
}

export type Geyser = {
  id: string
  rewardToken: string
  stakingToken: string
  totalStake: string
  totalStakeUnits: string
  status: GeyserStatus
  scalingFloor: string
  scalingCeiling: string
  scalingTime: string
  unlockedReward: string
  rewardSchedules: RewardSchedule[]
  lastUpdate: string
}

export type Lock = {
  id: string
  geyser: Geyser
  token: string
  amount: string
  lastUpdate: string
  stakeUnits: string
}

export type TokenInfo = {
  address: string
  name: string
  symbol: string
  decimals: number
}

export type TokenComposition = TokenInfo & {
  balance: number
  value: number
  weight: number
}

export type StakingTokenInfo = TokenInfo & {
  price: number
  totalSupply: number
  marketCap: number
  composition: TokenComposition[]
}

export type RewardTokenInfo = TokenInfo & {
  getTotalRewards: (rewardSchedules: RewardSchedule[]) => Promise<number>
}

export type GeyserInfo = {
  geyser: Geyser | null
  stakingTokenInfo: StakingTokenInfo
  rewardTokenInfo: RewardTokenInfo
}

export type GeyserStats = {
  duration: number
  totalDeposit: number
  totalRewards: number
  calcPeriodInDays: number
}

export type VaultTokenBalance = TokenInfo & {
  balance: number
  parsedBalance: BigNumber
  unlockedBalance: number
  parsedUnlockedBalance: BigNumber
}

export type VaultStats = {
  id: string
  stakingTokenBalance: number
  rewardTokenBalance: number
  vaultTokenBalances: VaultTokenBalance[]
  currentStake: number
  currentStakable: BigNumber
}

export type UserStats = {
  apy: number
  currentMultiplier: number
  minMultiplier: number
  maxMultiplier: number
  currentReward: number
}

export type GeyserConfig = {
  name: string
  address: string
  stakingToken: StakingToken
  rewardToken: RewardToken
}

export type AdditionalTokenConfig = {
  address: string
  enabled: boolean
  [key: string]: any
}

export type SupplyInfo = {
  timestamp: number
  supply: number
  epoch: number
}

export type SignerOrProvider = Signer | providers.Provider

export type TooltipMessage = {
  title: string
  body: string
}
