import { BigNumber } from 'ethers'

export interface Vault {
  id: string
  nonce: string
  // TODO: proper typing for reward and lock
  claimedReward: any[]
  locks: any[]
}

export interface Geyser {
  id: string
}

export interface TokenBalance {
  address: string
  balance: BigNumber
  name: string
}
