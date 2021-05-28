import { BigNumber } from 'ethers'

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
  SHUTDOWN = 'Shutdown'
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
}

export type Lock = {
  id: string
  geyser: Geyser
  token: string
  amount: string
}

export type TokenBalance = {
  address: string
  balance: BigNumber
  name: string
}
