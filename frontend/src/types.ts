import { BigNumber } from 'ethers'

export interface Vault {
  id: string
  nonce: string
  // TODO: proper typing for reward
  claimedReward: any[]
  locks: Lock[]
}

export interface Lock {
  id: string
  geyser: Geyser
  token: string
  amount: string
}

export interface Geyser {
  id: string
}

export interface TokenBalance {
  address: string
  balance: BigNumber
  name: string
}
