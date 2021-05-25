import { BigNumber } from 'ethers'

export type Vault = {
  id: string
  nonce: string
  // TODO: proper typing for reward
  claimedReward: any[]
  locks: Lock[]
}

export type Geyser = {
  id: string
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

export type ToggleOption = {
  displayName: string
}
