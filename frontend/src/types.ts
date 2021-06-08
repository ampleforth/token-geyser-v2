import { StakingToken } from './constants'

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
  totalRewardsClaimed: string
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

export type TokenComposition = {
  address: string
  name: string
  symbol: string
  decimals: number
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

export type GeyserStats = {
  duration: number
  totalDeposit: number
  totalRewardsClaimed: number
}

export type VaultStats = {
  id: string
  stakingTokenBalance: number
  platformTokenBalances: number[]
  rewardTokenBalance: number
  currentStake: number
}

export type UserStats = {
  apy: number
  currentMultiplier: number
  currentReward: number
}

export type GeyserConfig = {
  name: string
  address: string
  stakingToken: StakingToken
  platformTokenConfigs: PlatformTokenConfig[]
}

export type PlatformTokenConfig = {
  address: string
  claimLink?: string
}
